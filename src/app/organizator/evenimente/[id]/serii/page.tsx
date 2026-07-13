/* eslint-disable @typescript-eslint/no-explicit-any -- interogări Supabase încă netipizate */
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PageHeader, ButtonLink, Badge, Card } from '@/components/ui'
import GenerateHeatsButton from './generate-heats-button'
import { Timer } from 'lucide-react'

const STROKE_LABELS: Record<string, string> = {
  crawl: 'Crawl', spate: 'Spate', bras: 'Bras',
  crawl_pluta: 'Crawl cu plută', crawl_ajutatoare: 'Crawl cu ajutătoare',
}

export default async function SeriiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const sb = supabase as any

  const { data: event } = await sb.from('events')
    .select('id, name, edition, lanes_count, seeding_done').eq('id', id).single()
  if (!event) notFound()

  const { data: categories } = await sb.from('event_categories')
    .select(`id, label, gender, event_probes(id, stroke, order_index, heats(id, heat_number, status, heat_lanes(id, lane_number, seed_time, result_time, dns, dq, swimmers(full_name, birth_year))))`)
    .eq('event_id', id)
    .order('age_group_min')

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Serii & Rezultate"
        backHref={`/organizator/evenimente/${id}`}
        backLabel={`${event.name} Ed.${event.edition}`}
        action={
          <GenerateHeatsButton
            eventId={id}
            lanesCount={event.lanes_count}
            done={event.seeding_done}
          />
        }
      />

      {!event.seeding_done && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-sm text-amber-800">
          <strong>Seriile nu au fost generate.</strong> Apasă „Generează serii” după ce toate înscrierile sunt complete.
        </div>
      )}

      {categories?.map((cat: any) => (
        <div key={cat.id} className="mb-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">{cat.label}</h2>
          {cat.event_probes?.sort((a: any, b: any) => a.order_index - b.order_index).map((probe: any) => (
            <Card key={probe.id} className="mb-3 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">{STROKE_LABELS[probe.stroke] ?? probe.stroke}</span>
                  <Badge variant="neutral">{probe.heats?.length ?? 0} serii</Badge>
                </div>
                <ButtonLink
                  href={`/cronometror/${probe.id}`}
                  variant="secondary"
                  size="sm"
                  className="gap-1"
                >
                  <Timer className="w-3.5 h-3.5" />
                  Cronometrează
                </ButtonLink>
              </div>
              {probe.heats?.sort((a: any, b: any) => a.heat_number - b.heat_number).map((heat: any) => (
                <div key={heat.id} className="px-4 py-3 border-b border-slate-50 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Seria {heat.heat_number}</span>
                    <Badge variant={heat.status === 'completed' ? 'success' : heat.status === 'active' ? 'info' : 'neutral'}>
                      {heat.status === 'completed' ? 'Finalizată' : heat.status === 'active' ? 'Activă' : 'În așteptare'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
                    {heat.heat_lanes?.sort((a: any, b: any) => a.lane_number - b.lane_number).map((lane: any) => (
                      <div key={lane.id} className={`rounded-lg p-2 text-center text-xs ${lane.swimmer_id ? 'bg-blue-50 border border-blue-100' : 'bg-slate-50 border border-slate-100'}`}>
                        <p className="font-bold text-slate-400 text-[10px]">C{lane.lane_number}</p>
                        {lane.swimmers ? (
                          <>
                            <p className="font-medium text-slate-700 truncate text-[11px] mt-0.5">{lane.swimmers.full_name.split(' ')[0]}</p>
                            <p className="text-slate-400 text-[10px]">{lane.swimmers.birth_year}</p>
                            {lane.result_time && <p className="text-green-600 font-bold text-[10px]">{formatTime(lane.result_time)}</p>}
                            {lane.dns && <p className="text-red-500 text-[10px] font-bold">DNS</p>}
                            {lane.dq && <p className="text-orange-500 text-[10px] font-bold">DQ</p>}
                          </>
                        ) : (
                          <p className="text-slate-300 text-[10px] mt-1">—</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </Card>
          ))}
        </div>
      ))}
    </div>
  )
}

function formatTime(interval: string | null): string {
  if (!interval) return ''
  // interval vine ca "00:00:25.300000" din postgres
  const parts = interval.split(':')
  if (parts.length === 3) {
    const secs = parseFloat(parts[2]).toFixed(2)
    return `${parts[1]}:${secs}`
  }
  return interval
}
