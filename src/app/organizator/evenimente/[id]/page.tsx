'use client'

/* eslint-disable @typescript-eslint/no-explicit-any -- interogări Supabase încă netipizate */
import { use, useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CalendarDays, ExternalLink, ListOrdered, MapPin, Pencil, Plus, Timer, Trash2, Trophy, UsersRound } from 'lucide-react'
import { GENDER_LABELS, STROKE_LABELS, STROKES } from '@/lib/labels'
import { buildHeats } from '@/lib/seeding'
import { intervalToMs } from '@/lib/time'
import { Badge, Button, ButtonLink, Card, EmptyState, FormError, Input, Label, PageHeader, Select } from '@/components/ui'

export default function EvenimentAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient() as any

  const [event, setEvent] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState<string | null>(null) // acțiunea în curs
  const [error, setError] = useState<string | null>(null)

  const [showCatForm, setShowCatForm] = useState(false)
  const [catForm, setCatForm] = useState({ label: '', gender: 'M', ageMin: '6', ageMax: '7' })
  const [newProbe, setNewProbe] = useState<Record<string, string>>({}) // categoryId → stroke

  const load = useCallback(async () => {
    const [{ data: ev }, { data: cats }] = await Promise.all([
      supabase.from('events').select('*').eq('id', id).single(),
      supabase.from('event_categories')
        .select(`
          id, label, gender, age_group_min, age_group_max,
          event_probes(
            id, stroke, order_index,
            registrations(id, paid, seed_time, swimmers(id, full_name, birth_year, clubs(name)))
          )
        `)
        .eq('event_id', id)
        .order('created_at'),
    ])
    setEvent(ev)
    setCategories(cats ?? [])
    setLoaded(true)
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // setState se întâmplă după await, nu sincron — fals pozitiv
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  async function run(action: string, fn: () => Promise<{ error?: any } | void>) {
    setBusy(action)
    setError(null)
    const res = await fn()
    if (res && 'error' in res && res.error) setError(res.error.message ?? String(res.error))
    setBusy(null)
    load()
  }

  const updateEvent = (fields: Record<string, unknown>) =>
    supabase.from('events').update(fields).eq('id', id)

  async function addCategory(e: React.FormEvent) {
    e.preventDefault()
    await run('cat', async () => {
      const label = catForm.label.trim() ||
        `${catForm.ageMin}–${catForm.ageMax} ani ${GENDER_LABELS[catForm.gender as 'M' | 'F']}`
      const { error } = await supabase.from('event_categories').insert({
        event_id: id,
        label,
        gender: catForm.gender,
        age_group_min: Number(catForm.ageMin),
        age_group_max: Number(catForm.ageMax),
      })
      if (!error) {
        setCatForm({ label: '', gender: 'M', ageMin: '6', ageMax: '7' })
        setShowCatForm(false)
      }
      return { error }
    })
  }

  async function addProbe(categoryId: string) {
    const stroke = newProbe[categoryId]
    if (!stroke) return
    await run(`probe-${categoryId}`, async () => {
      const cat = categories.find(c => c.id === categoryId)
      const { error } = await supabase.from('event_probes').insert({
        category_id: categoryId,
        stroke,
        order_index: (cat?.event_probes?.length ?? 0) + 1,
      })
      if (!error) setNewProbe(p => ({ ...p, [categoryId]: '' }))
      return { error }
    })
  }

  /** Generează (sau regenerează) seriile pentru toate probele, după timpul de referință. */
  async function generateHeats() {
    await run('heats', async () => {
      const probes = categories.flatMap(c => c.event_probes ?? [])
      const probeIds = probes.map((p: any) => p.id)
      if (probeIds.length === 0) return { error: new Error('Adaugă întâi categorii și probe.') }

      // Curăță seriile existente (regenerare)
      const { data: oldHeats } = await supabase.from('heats').select('id').in('probe_id', probeIds)
      if (oldHeats?.length) {
        const oldIds = oldHeats.map((h: any) => h.id)
        await supabase.from('heat_lanes').delete().in('heat_id', oldIds)
        await supabase.from('heats').delete().in('id', oldIds)
      }

      for (const probe of probes) {
        const entries = (probe.registrations ?? []).map((r: any) => ({
          seedMs: intervalToMs(r.seed_time),
          data: r,
        }))
        const heats = buildHeats<any>(entries, event.lanes_count)
        for (const heat of heats) {
          const { data: created, error } = await supabase
            .from('heats')
            .insert({ probe_id: probe.id, heat_number: heat.heatNumber })
            .select('id')
            .single()
          if (error) return { error }
          const { error: lanesError } = await supabase.from('heat_lanes').insert(
            heat.lanes.map(l => ({
              heat_id: created.id,
              lane_number: l.laneNumber,
              swimmer_id: l.entry.data.swimmers?.id,
              seed_time: l.entry.data.seed_time,
            }))
          )
          if (lanesError) return { error: lanesError }
        }
      }
      return updateEvent({ seeding_done: true })
    })
  }

  if (!loaded) return <p className="text-slate-400 text-center py-16">Se încarcă...</p>
  if (!event) return <EmptyState icon={CalendarDays} title="Evenimentul nu a fost găsit." />

  const allRegistrations = categories.flatMap(c =>
    (c.event_probes ?? []).flatMap((p: any) =>
      (p.registrations ?? []).map((r: any) => ({ ...r, probe: p, category: c }))
    )
  )
  // Grupează înscrierile pe sportiv
  const bySwimmer = new Map<string, { swimmer: any; regs: any[] }>()
  allRegistrations.forEach(r => {
    if (!r.swimmers) return
    if (!bySwimmer.has(r.swimmers.id)) bySwimmer.set(r.swimmers.id, { swimmer: r.swimmers, regs: [] })
    bySwimmer.get(r.swimmers.id)!.regs.push(r)
  })
  const swimmerGroups = Array.from(bySwimmer.values())

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={`${event.name} — Ediția ${event.edition}`}
        backHref="/organizator/evenimente"
        backLabel="Evenimente"
      />

      {/* Status & acțiuni */}
      <Card className="p-5 mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant={event.published ? 'success' : 'warning'}>
            {event.published ? 'Publicat' : 'Draft'}
          </Badge>
          <Badge variant={event.registration_open ? 'info' : 'neutral'}>
            {event.registration_open ? 'Înscrieri deschise' : 'Înscrieri închise'}
          </Badge>
          {event.seeding_done && <Badge variant="neutral">Serii generate</Badge>}
        </div>
        <p className="text-sm text-slate-500 flex flex-wrap items-center gap-3 mb-4">
          <span className="flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5" aria-hidden />
            {new Date(event.date).toLocaleDateString('ro-RO')} · {event.time?.slice(0, 5)}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" aria-hidden />
            {event.location}
          </span>
          <span>{event.entry_fee} lei / probă · {event.lanes_count} culoare</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={event.published ? 'secondary' : 'primary'}
            disabled={busy !== null}
            onClick={() => run('publish', () => updateEvent({ published: !event.published }))}
          >
            {event.published ? 'Retrage publicarea' : 'Publică evenimentul'}
          </Button>
          <Button
            size="sm"
            variant={event.registration_open ? 'secondary' : 'primary'}
            disabled={busy !== null || !event.published}
            onClick={() => run('reg', () => updateEvent({ registration_open: !event.registration_open }))}
          >
            {event.registration_open ? 'Închide înscrierile' : 'Deschide înscrierile'}
          </Button>
          <ButtonLink href={`/organizator/evenimente/${id}/editare`} size="sm" variant="secondary">
            <Pencil className="w-4 h-4" aria-hidden />
            Editează
          </ButtonLink>
          <ButtonLink href={`/organizator/evenimente/${id}/echipa`} size="sm" variant="secondary">
            <UsersRound className="w-4 h-4" aria-hidden />
            Echipa
          </ButtonLink>
          {event.published && (
            <ButtonLink href={`/concursuri/${id}`} size="sm" variant="ghost">
              <ExternalLink className="w-4 h-4" aria-hidden />
              Pagina publică
            </ButtonLink>
          )}
        </div>
        {!event.published && (
          <p className="text-xs text-slate-400 mt-3">Înscrierile se pot deschide doar după publicare.</p>
        )}
      </Card>

      <FormError>{error}</FormError>

      {/* Categorii & probe */}
      <section className="mb-8 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-800">Categorii și probe</h2>
          {!showCatForm && (
            <Button size="sm" variant="secondary" onClick={() => setShowCatForm(true)}>
              <Plus className="w-4 h-4" aria-hidden />
              Categorie
            </Button>
          )}
        </div>

        {showCatForm && (
          <Card className="p-5 mb-4">
            <form onSubmit={addCategory} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="ageMin">Vârsta min</Label>
                  <Input id="ageMin" type="number" min={4} max={18} value={catForm.ageMin}
                    onChange={e => setCatForm(f => ({ ...f, ageMin: e.target.value }))} required />
                </div>
                <div>
                  <Label htmlFor="ageMax">Vârsta max</Label>
                  <Input id="ageMax" type="number" min={4} max={18} value={catForm.ageMax}
                    onChange={e => setCatForm(f => ({ ...f, ageMax: e.target.value }))} required />
                </div>
                <div>
                  <Label htmlFor="catGender">Gen</Label>
                  <Select id="catGender" value={catForm.gender}
                    onChange={e => setCatForm(f => ({ ...f, gender: e.target.value }))}>
                    <option value="M">Băieți</option>
                    <option value="F">Fete</option>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="catLabel">Etichetă <span className="text-slate-400 font-normal">(opțional — se generează automat)</span></Label>
                <Input id="catLabel" value={catForm.label}
                  onChange={e => setCatForm(f => ({ ...f, label: e.target.value }))}
                  placeholder={`ex: ${catForm.ageMin}–${catForm.ageMax} ani ${GENDER_LABELS[catForm.gender as 'M' | 'F']}`} />
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <Button type="button" variant="ghost" onClick={() => setShowCatForm(false)}>Anulează</Button>
                <Button type="submit" disabled={busy !== null}>Adaugă categoria</Button>
              </div>
            </form>
          </Card>
        )}

        {categories.length === 0 && !showCatForm ? (
          <EmptyState
            icon={ListOrdered}
            title="Nicio categorie definită."
            description="Adaugă categoriile de vârstă și probele lor — fără ele nu se pot face înscrieri."
          />
        ) : (
          <div className="space-y-3">
            {categories.map(cat => (
              <Card key={cat.id} className="p-5">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <p className="font-semibold text-slate-900">{cat.label}</p>
                  <button
                    title="Șterge categoria"
                    disabled={busy !== null}
                    onClick={() => run('delcat', () => supabase.from('event_categories').delete().eq('id', cat.id))}
                    className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {(cat.event_probes ?? []).sort((a: any, b: any) => a.order_index - b.order_index).map((p: any) => (
                    <span key={p.id} className="inline-flex items-center gap-1.5 text-sm bg-slate-100 text-slate-700 pl-3 pr-1.5 py-1 rounded-full">
                      {STROKE_LABELS[p.stroke as keyof typeof STROKE_LABELS]}
                      <span className="text-xs text-slate-400">({p.registrations?.length ?? 0} înscriși)</span>
                      <button
                        title="Șterge proba"
                        disabled={busy !== null}
                        onClick={() => run('delprobe', () => supabase.from('event_probes').delete().eq('id', p.id))}
                        className="w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden />
                      </button>
                    </span>
                  ))}
                  {(cat.event_probes ?? []).length === 0 && (
                    <p className="text-sm text-slate-400">Nicio probă încă.</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Select
                    className="flex-1"
                    value={newProbe[cat.id] ?? ''}
                    onChange={e => setNewProbe(p => ({ ...p, [cat.id]: e.target.value }))}
                  >
                    <option value="">Alege proba…</option>
                    {STROKES.map(s => <option key={s} value={s}>{STROKE_LABELS[s]}</option>)}
                  </Select>
                  <Button variant="secondary" disabled={!newProbe[cat.id] || busy !== null} onClick={() => addProbe(cat.id)}>
                    <Plus className="w-4 h-4" aria-hidden />
                    Adaugă
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Înscrieri & plăți */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">
          Înscrieri <span className="text-slate-400 font-normal">({allRegistrations.length})</span>
        </h2>
        {swimmerGroups.length === 0 ? (
          <p className="text-sm text-slate-400">Nicio înscriere încă. Apar aici după ce părinții înscriu sportivii.</p>
        ) : (
          <div className="space-y-3">
            {swimmerGroups.map(({ swimmer, regs }) => {
              const allPaid = regs.every(r => r.paid)
              const total = regs.length * Number(event.entry_fee ?? 0)
              return (
                <Card key={swimmer.id} className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-slate-900">{swimmer.full_name}</p>
                      <p className="text-xs text-slate-400">
                        {swimmer.birth_year}{swimmer.clubs?.name ? ` · ${swimmer.clubs.name}` : ''} · total {total} lei
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={allPaid ? 'secondary' : 'primary'}
                      disabled={busy !== null}
                      onClick={() => run('pay', async () => {
                        const { data: { user } } = await supabase.auth.getUser()
                        return supabase.from('registrations')
                          .update(allPaid
                            ? { paid: false, paid_at: null, payment_confirmed_by: null }
                            : { paid: true, paid_at: new Date().toISOString(), payment_confirmed_by: user?.id })
                          .in('id', regs.map(r => r.id))
                      })}
                    >
                      {allPaid ? 'Anulează plata' : 'Marchează plătit'}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {regs.map(r => (
                      <Badge key={r.id} variant={r.paid ? 'success' : 'warning'}>
                        {STROKE_LABELS[r.probe.stroke as keyof typeof STROKE_LABELS]} · {r.category.label}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* Serii & cronometraj */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Ziua concursului</h2>
        <Card className="p-5">
          <p className="text-sm text-slate-500 mb-4">
            {event.seeding_done
              ? 'Seriile sunt generate. Le poți regenera dacă apar înscrieri noi (timpii deja înregistrați se pierd).'
              : 'După închiderea înscrierilor, generează seriile — sportivii sunt distribuiți pe culoare după timpul de referință.'}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={event.seeding_done ? 'secondary' : 'primary'}
              disabled={busy !== null || allRegistrations.length === 0}
              onClick={generateHeats}
            >
              <ListOrdered className="w-4 h-4" aria-hidden />
              {busy === 'heats' ? 'Se generează...' : event.seeding_done ? 'Regenerează seriile' : 'Generează seriile'}
            </Button>
            {event.seeding_done && (
              <>
                <ButtonLink href={`/concursuri/${id}/serii`} variant="secondary">
                  <ListOrdered className="w-4 h-4" aria-hidden />
                  Liste de start
                </ButtonLink>
                <ButtonLink href={`/organizator/evenimente/${id}/cronometraj`} variant="primary">
                  <Timer className="w-4 h-4" aria-hidden />
                  Cronometraj
                </ButtonLink>
                <ButtonLink href={`/concursuri/${id}/rezultate`} variant="secondary">
                  <Trophy className="w-4 h-4" aria-hidden />
                  Rezultate
                </ButtonLink>
              </>
            )}
          </div>
          {allRegistrations.length === 0 && (
            <p className="text-xs text-slate-400 mt-3">Seriile se pot genera abia după ce există înscrieri.</p>
          )}
        </Card>
      </section>
    </div>
  )
}
