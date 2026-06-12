'use client'

/* eslint-disable @typescript-eslint/no-explicit-any -- interogări Supabase încă netipizate */
import { use, useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, Timer } from 'lucide-react'
import { STROKE_LABELS } from '@/lib/labels'
import { formatInterval, parseTimeInput } from '@/lib/time'
import { Badge, Button, Card, EmptyState, FormError, PageHeader } from '@/components/ui'

type LaneEdit = { time: string; dns: boolean; dq: boolean }

export default function CronometrajPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient() as any

  const [event, setEvent] = useState<any>(null)
  const [probes, setProbes] = useState<any[]>([])
  const [activeProbe, setActiveProbe] = useState<string | null>(null)
  const [edits, setEdits] = useState<Record<string, LaneEdit>>({})
  const [loaded, setLoaded] = useState(false)
  const [savingHeat, setSavingHeat] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [{ data: ev }, { data: cats }] = await Promise.all([
      supabase.from('events').select('id, name, edition').eq('id', id).single(),
      supabase.from('event_categories')
        .select(`
          id, label,
          event_probes(
            id, stroke, order_index,
            heats(
              id, heat_number, status,
              heat_lanes(id, lane_number, seed_time, result_time, dns, dq, swimmers(full_name))
            )
          )
        `)
        .eq('event_id', id)
        .order('created_at'),
    ])

    const flat = (cats ?? []).flatMap((c: any) =>
      (c.event_probes ?? [])
        .filter((p: any) => (p.heats ?? []).length > 0)
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((p: any) => ({ ...p, categoryLabel: c.label }))
    )
    setEvent(ev)
    setProbes(flat)
    setActiveProbe(prev => prev ?? flat[0]?.id ?? null)
    setLoaded(true)
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // setState se întâmplă după await, nu sincron — fals pozitiv
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  function getEdit(lane: any): LaneEdit {
    return edits[lane.id] ?? {
      time: lane.result_time ? formatInterval(lane.result_time) : '',
      dns: lane.dns,
      dq: lane.dq,
    }
  }

  function setEdit(laneId: string, lane: any, patch: Partial<LaneEdit>) {
    setEdits(prev => ({ ...prev, [laneId]: { ...getEdit(lane), ...(prev[laneId] ?? {}), ...patch } }))
  }

  async function saveHeat(heat: any) {
    setSavingHeat(heat.id)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    const lanes = (heat.heat_lanes ?? []).filter((l: any) => l.swimmers)

    for (const lane of lanes) {
      const edit = getEdit(lane)
      const interval = edit.time.trim() ? parseTimeInput(edit.time) : null
      if (edit.time.trim() && !interval) {
        setError(`Timp invalid pe culoarul ${lane.lane_number}: „${edit.time}". Format: 1:23.45`)
        setSavingHeat(null)
        return
      }
      const { error } = await supabase.from('heat_lanes')
        .update({
          result_time: edit.dns || edit.dq ? null : interval,
          dns: edit.dns,
          dq: edit.dq,
          recorded_by: user?.id,
          recorded_at: new Date().toISOString(),
        })
        .eq('id', lane.id)
      if (error) {
        setError(error.message)
        setSavingHeat(null)
        return
      }
    }

    await supabase.from('heats').update({ status: 'completed' }).eq('id', heat.id)
    setSavingHeat(null)
    load()
  }

  if (!loaded) return <p className="text-slate-400 text-center py-16">Se încarcă...</p>
  if (!event) return <EmptyState icon={Timer} title="Evenimentul nu a fost găsit." />

  const probe = probes.find(p => p.id === activeProbe)

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Cronometraj"
        description={`${event.name} — Ediția ${event.edition}`}
        backHref={`/organizator/evenimente/${id}`}
        backLabel="Eveniment"
      />

      {probes.length === 0 ? (
        <EmptyState
          icon={Timer}
          title="Nu există serii generate."
          description="Generează seriile din pagina evenimentului înainte de cronometraj."
        />
      ) : (
        <>
          {/* Selector de probă — chips scrollabile, prietenoase cu degetul */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            {probes.map(p => {
              const done = (p.heats ?? []).every((h: any) => h.status === 'completed')
              return (
                <button
                  key={p.id}
                  onClick={() => setActiveProbe(p.id)}
                  className={`shrink-0 inline-flex items-center gap-1.5 h-11 px-4 rounded-xl text-sm font-medium transition ${
                    p.id === activeProbe
                      ? 'bg-brand-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  {done && <Check className="w-4 h-4" aria-hidden />}
                  {STROKE_LABELS[p.stroke as keyof typeof STROKE_LABELS]} · {p.categoryLabel}
                </button>
              )
            })}
          </div>

          <FormError>{error}</FormError>

          {probe && (
            <div className="space-y-4 mt-4">
              {(probe.heats ?? [])
                .sort((a: any, b: any) => a.heat_number - b.heat_number)
                .map((heat: any) => {
                  const lanes = (heat.heat_lanes ?? []).sort((a: any, b: any) => a.lane_number - b.lane_number)
                  return (
                    <Card key={heat.id} className="p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-semibold text-slate-900">Seria {heat.heat_number}</p>
                        <Badge variant={heat.status === 'completed' ? 'success' : 'neutral'}>
                          {heat.status === 'completed' ? 'Finalizată' : 'În așteptare'}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        {lanes.filter((l: any) => l.swimmers).map((lane: any) => {
                          const edit = getEdit(lane)
                          return (
                            <div key={lane.id} className="flex items-center gap-2">
                              <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 text-sm font-bold flex items-center justify-center shrink-0">
                                {lane.lane_number}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-slate-800 truncate">{lane.swimmers.full_name}</p>
                                {lane.seed_time && (
                                  <p className="text-xs text-slate-400">ref: {formatInterval(lane.seed_time)}</p>
                                )}
                              </div>
                              <input
                                type="text"
                                inputMode="decimal"
                                placeholder="1:23.45"
                                value={edit.dns || edit.dq ? '' : edit.time}
                                disabled={edit.dns || edit.dq}
                                onChange={e => setEdit(lane.id, lane, { time: e.target.value })}
                                className="w-24 h-11 rounded-xl border border-slate-300 px-2 text-center font-mono text-base tabular-nums outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-300"
                              />
                              <button
                                onClick={() => setEdit(lane.id, lane, { dns: !edit.dns, dq: false })}
                                className={`h-11 px-2.5 rounded-xl text-xs font-bold transition shrink-0 ${
                                  edit.dns ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                DNS
                              </button>
                              <button
                                onClick={() => setEdit(lane.id, lane, { dq: !edit.dq, dns: false })}
                                className={`h-11 px-2.5 rounded-xl text-xs font-bold transition shrink-0 ${
                                  edit.dq ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                DQ
                              </button>
                            </div>
                          )
                        })}
                      </div>

                      <Button
                        className="w-full mt-4"
                        variant={heat.status === 'completed' ? 'secondary' : 'primary'}
                        disabled={savingHeat !== null}
                        onClick={() => saveHeat(heat)}
                      >
                        {savingHeat === heat.id
                          ? 'Se salvează...'
                          : heat.status === 'completed' ? 'Actualizează timpii' : 'Salvează seria'}
                      </Button>
                    </Card>
                  )
                })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
