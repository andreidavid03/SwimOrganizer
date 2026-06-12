'use client'

/* eslint-disable @typescript-eslint/no-explicit-any -- interogări Supabase încă netipizate */
import { use, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Banknote, CalendarDays, ListOrdered, MapPin, Trophy, Waves } from 'lucide-react'
import { GENDER_LABELS, STROKE_LABELS } from '@/lib/labels'
import { Badge, Button, ButtonLink, Card, EmptyState, FormError, PageHeader } from '@/components/ui'

type Probe = { id: string; stroke: string; category: { id: string; label: string; gender: 'M' | 'F'; age_group_min: number; age_group_max: number; birth_year: number | null } }
type Swimmer = { id: string; full_name: string; birth_year: number; gender: 'M' | 'F' }

export default function ConcursPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient() as any

  const [event, setEvent] = useState<any>(null)
  const [probes, setProbes] = useState<Probe[]>([])
  const [swimmers, setSwimmers] = useState<Swimmer[]>([])
  const [existing, setExisting] = useState<Set<string>>(new Set()) // `${swimmerId}:${probeId}`
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [hasResults, setHasResults] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const load = useCallback(async () => {
    const [{ data: ev }, { data: cats }, { data: sw }] = await Promise.all([
      supabase.from('events').select('*').eq('id', id).single(),
      supabase.from('event_categories')
        .select('id, label, gender, age_group_min, age_group_max, birth_year, event_probes(id, stroke, order_index)')
        .eq('event_id', id),
      supabase.from('swimmers').select('id, full_name, birth_year, gender'),
    ])

    const flatProbes: Probe[] = (cats ?? []).flatMap((c: any) =>
      (c.event_probes ?? []).map((p: any) => ({
        id: p.id,
        stroke: p.stroke,
        category: { id: c.id, label: c.label, gender: c.gender, age_group_min: c.age_group_min, age_group_max: c.age_group_max, birth_year: c.birth_year },
      }))
    )

    const probeIds = flatProbes.map(p => p.id)
    const swimmerIds = (sw ?? []).map((s: any) => s.id)
    const existingSet = new Set<string>()
    let resultsFound = false

    if (probeIds.length > 0) {
      if (swimmerIds.length > 0) {
        const { data: regs } = await supabase
          .from('registrations')
          .select('swimmer_id, probe_id')
          .in('probe_id', probeIds)
          .in('swimmer_id', swimmerIds)
        regs?.forEach((r: any) => existingSet.add(`${r.swimmer_id}:${r.probe_id}`))
      }
      const { data: lanes } = await supabase
        .from('heat_lanes')
        .select('id, heats!inner(probe_id)')
        .in('heats.probe_id', probeIds)
        .not('result_time', 'is', null)
        .limit(1)
      resultsFound = (lanes?.length ?? 0) > 0
    }

    setEvent(ev)
    setProbes(flatProbes)
    setSwimmers(sw ?? [])
    setExisting(existingSet)
    setHasResults(resultsFound)
    setLoaded(true)
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // setState se întâmplă după await, nu sincron — fals pozitiv
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  const eventYear = event ? new Date(event.date).getFullYear() : new Date().getFullYear()

  /** Probele la care se potrivește un sportiv (gen + an naștere / grupă de vârstă). */
  const matchingProbes = useMemo(() => {
    const map = new Map<string, Probe[]>()
    swimmers.forEach(s => {
      const age = eventYear - s.birth_year
      map.set(s.id, probes.filter(p =>
        p.category.gender === s.gender &&
        (p.category.birth_year !== null
          ? p.category.birth_year === s.birth_year
          : age >= p.category.age_group_min && age <= p.category.age_group_max)
      ))
    })
    return map
  }, [swimmers, probes, eventYear])

  function toggle(key: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function handleSubmit() {
    setSaving(true)
    setError(null)
    setSuccess(false)

    const rows = Array.from(selected).map(key => {
      const [swimmer_id, probe_id] = key.split(':')
      return { swimmer_id, probe_id }
    })
    const { error } = await supabase.from('registrations').insert(rows)

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    setSelected(new Set())
    setSuccess(true)
    setSaving(false)
    load()
  }

  if (!loaded) return <p className="text-slate-400 text-center py-16">Se încarcă...</p>

  if (!event) {
    return (
      <EmptyState
        icon={Trophy}
        title="Concursul nu a fost găsit."
        action={<ButtonLink href="/concursuri" variant="secondary">Înapoi la concursuri</ButtonLink>}
      />
    )
  }

  const total = selected.size * Number(event.entry_fee ?? 0)

  return (
    <div>
      <PageHeader title={event.name} description={`Ediția ${event.edition}`} backHref="/concursuri" backLabel="Concursuri" />

      {/* Detalii eveniment */}
      <Card className="p-5 mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant={event.registration_open ? 'success' : 'neutral'}>
            {event.registration_open ? 'Înscrieri deschise' : 'Înscrieri închise'}
          </Badge>
          {hasResults && <Badge variant="info">Rezultate disponibile</Badge>}
        </div>
        <div className="space-y-1.5 text-sm text-slate-600">
          <p className="flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" aria-hidden />
            {new Date(event.date).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · ora {event.time?.slice(0, 5)}
          </p>
          <p className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" aria-hidden />
            {event.location}
          </p>
          <p className="flex items-center gap-1.5">
            <Banknote className="w-4 h-4 text-slate-400 shrink-0" aria-hidden />
            {event.entry_fee} lei / probă
          </p>
          {event.registration_deadline && (
            <p className="text-amber-600 font-medium">
              Termen de înscriere: {new Date(event.registration_deadline).toLocaleDateString('ro-RO')}
            </p>
          )}
        </div>
        {(hasResults || event.seeding_done) && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
            {event.seeding_done && (
              <ButtonLink href={`/concursuri/${id}/serii`} variant="secondary" size="sm">
                <ListOrdered className="w-4 h-4" aria-hidden />
                Liste de start
              </ButtonLink>
            )}
            {hasResults && (
              <ButtonLink href={`/concursuri/${id}/rezultate`} variant="secondary" size="sm">
                <Trophy className="w-4 h-4" aria-hidden />
                Vezi rezultatele
              </ButtonLink>
            )}
          </div>
        )}
      </Card>

      {/* Înscriere */}
      {event.registration_open && (
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Înscrie sportivii</h2>

          {swimmers.length === 0 ? (
            <EmptyState
              icon={Waves}
              title="Nu ai niciun sportiv adăugat."
              description="Adaugă-ți copilul mai întâi, apoi revino aici pentru înscriere."
              action={<ButtonLink href="/concursuri/sportivii-mei" variant="secondary">Adaugă sportiv</ButtonLink>}
            />
          ) : (
            <div className="space-y-4">
              {swimmers.map(s => {
                const matches = matchingProbes.get(s.id) ?? []
                return (
                  <Card key={s.id} className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <p className="font-semibold text-slate-900">{s.full_name}</p>
                      <span className="text-sm text-slate-500">{s.birth_year} · {GENDER_LABELS[s.gender]}</span>
                    </div>

                    {matches.length === 0 ? (
                      <p className="text-sm text-slate-400">Nicio probă disponibilă pentru categoria acestui sportiv.</p>
                    ) : (
                      <div className="space-y-2">
                        {matches.map(p => {
                          const key = `${s.id}:${p.id}`
                          const already = existing.has(key)
                          const checked = selected.has(key)
                          return (
                            <label
                              key={p.id}
                              className={`flex items-center gap-3 rounded-xl border px-4 py-3 min-h-12 transition ${
                                already
                                  ? 'bg-slate-50 border-slate-200 opacity-70'
                                  : checked
                                    ? 'bg-brand-50 border-brand-300 cursor-pointer'
                                    : 'border-slate-200 hover:border-brand-200 cursor-pointer'
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="w-5 h-5 accent-brand-600 shrink-0"
                                checked={already || checked}
                                disabled={already}
                                onChange={() => toggle(key)}
                              />
                              <span className="text-sm font-medium text-slate-800">
                                {STROKE_LABELS[p.stroke as keyof typeof STROKE_LABELS] ?? p.stroke}
                              </span>
                              <span className="text-xs text-slate-500 ml-auto">{p.category.label}</span>
                              {already && <Badge variant="success" className="shrink-0">Înscris</Badge>}
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </Card>
                )
              })}

              <FormError>{error}</FormError>
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
                  Înscriere trimisă! O găsești în{' '}
                  <Link href="/concursuri/inscrierile-mele" className="font-semibold underline">Înscrierile mele</Link>.
                </div>
              )}

              {selected.size > 0 && (
                <Card className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sticky bottom-20 sm:bottom-4 shadow-lg">
                  <p className="text-sm font-semibold text-slate-800 sm:mr-auto">
                    {selected.size} {selected.size === 1 ? 'probă selectată' : 'probe selectate'} · total {total} lei
                  </p>
                  <Button onClick={handleSubmit} disabled={saving}>
                    {saving ? 'Se trimite...' : 'Trimite înscrierea'}
                  </Button>
                </Card>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
