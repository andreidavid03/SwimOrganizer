/* eslint-disable @typescript-eslint/no-explicit-any -- interogări Supabase încă netipizate */
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui'
import CronometrorClient from './cronometror-client'

const STROKE_LABELS: Record<string, string> = {
  crawl: 'Crawl', spate: 'Spate', bras: 'Bras',
  crawl_pluta: 'Crawl cu plută', crawl_ajutatoare: 'Crawl cu ajutătoare',
}

export default async function CronometrorPage({ params }: { params: Promise<{ probeId: string }> }) {
  const { probeId } = await params
  const supabase = await createClient()
  const sb = supabase as any

  const { data: probe } = await sb
    .from('event_probes')
    .select('id, stroke, event_categories(label, event_id, events(name, edition, lanes_count))')
    .eq('id', probeId)
    .single()

  if (!probe) notFound()

  const { data: heats } = await sb
    .from('heats')
    .select('id, heat_number, status, heat_lanes(id, lane_number, seed_time, result_time, dns, dq, swimmer_id, swimmers(full_name, birth_year))')
    .eq('probe_id', probeId)
    .order('heat_number')

  const event = probe.event_categories?.events
  const category = probe.event_categories

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">{event?.name} — Ed. {event?.edition}</p>
            <h1 className="text-lg font-bold">
              {category?.label} · {STROKE_LABELS[probe.stroke] ?? probe.stroke}
            </h1>
          </div>
          <Badge variant="info">{heats?.length ?? 0} serii</Badge>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <CronometrorClient heats={heats ?? []} />
      </div>
    </div>
  )
}
