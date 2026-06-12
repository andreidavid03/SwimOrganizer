/* eslint-disable @typescript-eslint/no-explicit-any -- interogări Supabase încă netipizate */
import { createClient } from '@/lib/supabase/server'
import { CalendarDays, MapPin, Trophy } from 'lucide-react'
import { Badge, CardLink, EmptyState } from '@/components/ui'

export default async function ConcursuriPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const sb = supabase as any

  // Concursuri deschise pentru înscriere
  const { data: openEvents } = await sb
    .from('events')
    .select('id, name, edition, date, time, location, entry_fee, registration_deadline')
    .eq('published', true)
    .eq('registration_open', true)
    .order('date', { ascending: true })

  // Concursurile la care e înscris userul (prin copiii lor)
  const { data: myRegistrations } = await sb
    .from('registrations')
    .select(`
      id, registered_at, paid,
      swimmers(full_name, birth_year),
      event_probes(
        stroke,
        event_categories(
          label,
          events(id, name, edition, date, location)
        )
      )
    `)
    .in('swimmer_id',
      (await sb.from('swimmers').select('id').eq('parent_id', user?.id)).data?.map((s: any) => s.id) || []
    )
    .order('registered_at', { ascending: false })
    .limit(10)

  // Grupează înscrierea pe eveniment
  const eventMap = new Map<string, { event: any; registrations: any[] }>()
  myRegistrations?.forEach((reg: any) => {
    const event = reg.event_probes?.event_categories?.events
    if (!event) return
    if (!eventMap.has(event.id)) eventMap.set(event.id, { event, registrations: [] })
    eventMap.get(event.id)!.registrations.push(reg)
  })
  const myEvents = Array.from(eventMap.values())

  return (
    <div>
      {/* Concursuri deschise */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Înscrieri deschise</h2>

        {openEvents && openEvents.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {openEvents.map((event: any) => (
              <CardLink key={event.id} href={`/concursuri/${event.id}`} className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-semibold text-slate-900 group-hover:text-brand-700 transition">
                      {event.name}
                    </p>
                    <p className="text-sm text-slate-500 mt-0.5">Ediția {event.edition}</p>
                  </div>
                  <Badge variant="success" className="shrink-0">Deschis</Badge>
                </div>
                <div className="space-y-1.5 text-sm text-slate-500">
                  <p className="flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 shrink-0" aria-hidden />
                    {new Date(event.date).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {event.time?.slice(0, 5)}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 shrink-0" aria-hidden />
                    {event.location}
                  </p>
                  {event.registration_deadline && (
                    <p className="text-amber-600 font-medium">
                      Termen înscriere: {new Date(event.registration_deadline).toLocaleDateString('ro-RO')}
                    </p>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">{event.entry_fee} lei / participant</span>
                  <span className="text-sm text-brand-600 font-medium group-hover:underline">Înscrie-te →</span>
                </div>
              </CardLink>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Trophy}
            title="Niciun concurs deschis momentan."
            description="Revino mai târziu — concursurile noi apar aici imediat ce se deschid înscrierile."
          />
        )}
      </section>

      {/* Înscrierile mele */}
      {myEvents.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Înscrierile mele</h2>
          <div className="space-y-3">
            {myEvents.map(({ event, registrations }) => {
              const allPaid = registrations.every((r: any) => r.paid)
              return (
                <CardLink key={event.id} href={`/concursuri/${event.id}`} className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div>
                      <p className="font-semibold text-slate-900">{event.name} — Ediția {event.edition}</p>
                      <p className="text-sm text-slate-500">{new Date(event.date).toLocaleDateString('ro-RO')} · {event.location}</p>
                    </div>
                    <Badge variant={allPaid ? 'success' : 'warning'}>
                      {allPaid ? 'Plătit' : 'Plată în așteptare'}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {registrations.map((reg: any, i: number) => (
                      <Badge key={i} variant="neutral">
                        {reg.swimmers?.full_name} · {reg.event_probes?.stroke}
                      </Badge>
                    ))}
                  </div>
                </CardLink>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
