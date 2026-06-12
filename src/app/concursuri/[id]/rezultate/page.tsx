/* eslint-disable @typescript-eslint/no-explicit-any -- interogări Supabase încă netipizate */
import { createClient } from '@/lib/supabase/server'
import { Medal, Trophy } from 'lucide-react'
import { STROKE_LABELS } from '@/lib/labels'
import { formatInterval, intervalToMs } from '@/lib/time'
import { Badge, Card, EmptyState, PageHeader } from '@/components/ui'
import { PrintButton } from '@/components/print-button'

const medalColors = ['text-amber-500', 'text-slate-400', 'text-amber-700']

export default async function RezultatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const sb = supabase as any

  const [{ data: event }, { data: categories }] = await Promise.all([
    sb.from('events').select('id, name, edition, date').eq('id', id).single(),
    sb.from('event_categories')
      .select(`
        id, label,
        event_probes(
          id, stroke, order_index,
          heats(
            id, heat_number,
            heat_lanes(id, lane_number, result_time, dns, dq, swimmers(full_name, clubs(name)))
          )
        )
      `)
      .eq('event_id', id)
      .order('created_at'),
  ])

  if (!event) {
    return <EmptyState icon={Trophy} title="Concursul nu a fost găsit." />
  }

  // Clasament pe probă: toate culoarele cu sportiv, sortate după timp
  const sections = (categories ?? []).flatMap((cat: any) =>
    (cat.event_probes ?? [])
      .sort((a: any, b: any) => a.order_index - b.order_index)
      .map((probe: any) => {
        const lanes = (probe.heats ?? []).flatMap((h: any) => h.heat_lanes ?? []).filter((l: any) => l.swimmers)
        const ranked = lanes
          .filter((l: any) => l.result_time && !l.dns && !l.dq)
          .sort((a: any, b: any) => (intervalToMs(a.result_time) ?? Infinity) - (intervalToMs(b.result_time) ?? Infinity))
        const unranked = lanes.filter((l: any) => !l.result_time || l.dns || l.dq)
        return { probe, category: cat, ranked, unranked }
      })
      .filter((s: any) => s.ranked.length > 0 || s.unranked.length > 0)
  )

  return (
    <div>
      <PageHeader
        title="Rezultate"
        description={`${event.name} — Ediția ${event.edition} · ${new Date(event.date).toLocaleDateString('ro-RO')}`}
        backHref={`/concursuri/${id}`}
        backLabel="Concurs"
        action={sections.length > 0 ? <PrintButton /> : undefined}
      />

      {sections.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Nu există rezultate încă."
          description="Rezultatele apar aici pe măsură ce sunt înregistrate de cronometrori."
        />
      ) : (
        <div className="space-y-6">
          {sections.map(({ probe, category, ranked, unranked }: any) => (
            <section key={probe.id}>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">
                {STROKE_LABELS[probe.stroke as keyof typeof STROKE_LABELS] ?? probe.stroke}
                <span className="text-slate-400 font-normal"> · {category.label}</span>
              </h2>
              <Card className="divide-y divide-slate-100">
                {ranked.map((lane: any, i: number) => (
                  <div key={lane.id} className="flex items-center gap-3 px-4 sm:px-5 py-3">
                    <span className="w-7 text-center shrink-0">
                      {i < 3
                        ? <Medal className={`w-5 h-5 inline ${medalColors[i]}`} aria-label={`Locul ${i + 1}`} />
                        : <span className="text-sm font-semibold text-slate-400">{i + 1}</span>}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">{lane.swimmers.full_name}</p>
                      {lane.swimmers.clubs?.name && (
                        <p className="text-xs text-slate-400 truncate">{lane.swimmers.clubs.name}</p>
                      )}
                    </div>
                    <span className="ml-auto font-mono font-semibold text-slate-900 tabular-nums">
                      {formatInterval(lane.result_time)}
                    </span>
                  </div>
                ))}
                {unranked.map((lane: any) => (
                  <div key={lane.id} className="flex items-center gap-3 px-4 sm:px-5 py-3 opacity-60">
                    <span className="w-7 shrink-0" />
                    <p className="font-medium text-slate-700 truncate">{lane.swimmers.full_name}</p>
                    <span className="ml-auto">
                      <Badge variant={lane.dq ? 'danger' : 'neutral'}>
                        {lane.dq ? 'Descalificat' : lane.dns ? 'Neprezentat' : 'Fără timp'}
                      </Badge>
                    </span>
                  </div>
                ))}
              </Card>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
