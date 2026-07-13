import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildHeats, laneOrder } from '@/lib/seeding'
import { intervalToMs } from '@/lib/time'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Neautentificat.' }, { status: 401 })

  // Numărul de culoare vine din eveniment (nu din body — nu avem încredere în client)
  const { data: event } = await sb
    .from('events')
    .select('id, lanes_count, created_by')
    .eq('id', eventId)
    .single()
  if (!event) return NextResponse.json({ error: 'Evenimentul nu există.' }, { status: 404 })

  const lanesCount: number = event.lanes_count

  const { data: categories } = await sb
    .from('event_categories')
    .select('id, event_probes(id)')
    .eq('event_id', eventId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allProbeIds: string[] = categories?.flatMap((c: any) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    c.event_probes?.map((p: any) => p.id) ?? []
  ) ?? []

  if (allProbeIds.length === 0) {
    return NextResponse.json({ error: 'Nicio probă definită.' }, { status: 400 })
  }

  for (const probeId of allProbeIds) {
    // Regenerare: șterge seriile existente (cascade curăță heat_lanes)
    await sb.from('heats').delete().eq('probe_id', probeId)

    const { data: regs } = await sb
      .from('registrations')
      .select('swimmer_id, seed_time')
      .eq('probe_id', probeId)

    if (!regs || regs.length === 0) continue

    // Ordonare + distribuție pe serii/culoare prin biblioteca partajată (testată)
    type Reg = { swimmer_id: string; seed_time: string | null }
    const heats = buildHeats<Reg>(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      regs.map((r: any) => ({ seedMs: intervalToMs(r.seed_time), data: r as Reg })),
      lanesCount,
    )
    const order = laneOrder(lanesCount)

    for (const heat of heats) {
      const { data: created } = await sb
        .from('heats')
        .insert({ probe_id: probeId, heat_number: heat.heatNumber })
        .select('id')
        .single()
      if (!created) continue

      const occupied = new Map<number, Reg>(heat.lanes.map(l => [l.laneNumber, l.entry.data]))
      // Toate culoarele bazinului: cele ocupate primesc înotătorul, restul rămân goale
      const rows = order.map(laneNumber => {
        const swimmer = occupied.get(laneNumber)
        return {
          heat_id: created.id,
          lane_number: laneNumber,
          swimmer_id: swimmer?.swimmer_id ?? null,
          seed_time: swimmer?.seed_time ?? null,
        }
      })
      await sb.from('heat_lanes').insert(rows)
    }
  }

  await sb.from('events').update({ seeding_done: true }).eq('id', eventId)

  return NextResponse.json({ ok: true })
}
