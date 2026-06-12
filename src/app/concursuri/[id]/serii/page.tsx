/* eslint-disable @typescript-eslint/no-explicit-any -- interogări Supabase încă netipizate */
import { createClient } from '@/lib/supabase/server'
import { ListOrdered } from 'lucide-react'
import { STROKE_LABELS } from '@/lib/labels'
import { formatInterval } from '@/lib/time'
import { Card, EmptyState, PageHeader } from '@/components/ui'
import { PrintButton } from '@/components/print-button'

export default async function ListeStartPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const sb = supabase as any

  const [{ data: event }, { data: categories }] = await Promise.all([
    sb.from('events').select('id, name, edition, date, time, location').eq('id', id).single(),
    sb.from('event_categories')
      .select(`
        id, label,
        event_probes(
          id, stroke, order_index,
          heats(
            id, heat_number,
            heat_lanes(id, lane_number, seed_time, swimmers(full_name, birth_year, clubs(name)))
          )
        )
      `)
      .eq('event_id', id)
      .order('created_at'),
  ])

  if (!event) {
    return <EmptyState icon={ListOrdered} title="Concursul nu a fost găsit." />
  }

  const sections = (categories ?? []).flatMap((cat: any) =>
    (cat.event_probes ?? [])
      .filter((p: any) => (p.heats ?? []).length > 0)
      .sort((a: any, b: any) => a.order_index - b.order_index)
      .map((probe: any) => ({ probe, category: cat }))
  )

  return (
    <div>
      <PageHeader
        title="Liste de start"
        description={`${event.name} — Ediția ${event.edition} · ${new Date(event.date).toLocaleDateString('ro-RO')} · ${event.location}`}
        backHref={`/concursuri/${id}`}
        backLabel="Concurs"
        action={sections.length > 0 ? <PrintButton /> : undefined}
      />

      {sections.length === 0 ? (
        <EmptyState
          icon={ListOrdered}
          title="Listele de start nu sunt generate încă."
          description="Apar aici după ce organizatorul generează seriile."
        />
      ) : (
        <div className="space-y-6">
          {sections.map(({ probe, category }: any) => (
            <section key={probe.id} className="break-inside-avoid">
              <h2 className="text-lg font-semibold text-slate-800 mb-2">
                {STROKE_LABELS[probe.stroke as keyof typeof STROKE_LABELS] ?? probe.stroke}
                <span className="text-slate-400 font-normal"> · {category.label}</span>
              </h2>
              <div className="space-y-3">
                {(probe.heats ?? [])
                  .sort((a: any, b: any) => a.heat_number - b.heat_number)
                  .map((heat: any) => (
                    <Card key={heat.id} className="p-4 sm:p-5 break-inside-avoid">
                      <p className="font-semibold text-slate-900 mb-2">Seria {heat.heat_number}</p>
                      <div className="divide-y divide-slate-100">
                        {(heat.heat_lanes ?? [])
                          .sort((a: any, b: any) => a.lane_number - b.lane_number)
                          .map((lane: any) => (
                            <div key={lane.id} className="flex items-center gap-3 py-2">
                              <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-sm font-bold flex items-center justify-center shrink-0">
                                {lane.lane_number}
                              </span>
                              {lane.swimmers ? (
                                <>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-900 truncate">{lane.swimmers.full_name}</p>
                                    <p className="text-xs text-slate-400 truncate">
                                      {lane.swimmers.birth_year}
                                      {lane.swimmers.clubs?.name ? ` · ${lane.swimmers.clubs.name}` : ''}
                                    </p>
                                  </div>
                                  {lane.seed_time && (
                                    <span className="ml-auto text-sm font-mono text-slate-500 tabular-nums">
                                      {formatInterval(lane.seed_time)}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-sm text-slate-300">— liber —</span>
                              )}
                            </div>
                          ))}
                      </div>
                    </Card>
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
