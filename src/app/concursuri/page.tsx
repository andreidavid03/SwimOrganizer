import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ConcursuriPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Înscrieri deschise</h2>
        </div>

        {openEvents && openEvents.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {openEvents.map((event: any) => (
              <Link
                key={event.id}
                href={`/concursuri/${event.id}`}
                className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-sm transition group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-slate-900 group-hover:text-blue-700 transition">
                      {event.name}
                    </p>
                    <p className="text-sm text-slate-500 mt-0.5">Ediția {event.edition}</p>
                  </div>
                  <span className="text-xs font-medium bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full shrink-0">
                    Deschis
                  </span>
                </div>
                <div className="space-y-1.5 text-sm text-slate-500">
                  <p>{new Date(event.date).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {event.time?.slice(0, 5)}</p>
                  <p>{event.location}</p>
                  {event.registration_deadline && (
                    <p className="text-amber-600 font-medium">
                      Termen înscriere: {new Date(event.registration_deadline).toLocaleDateString('ro-RO')}
                    </p>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">{event.entry_fee} lei / participant</span>
                  <span className="text-sm text-blue-600 font-medium group-hover:underline">Înscrie-te →</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 py-12 text-center">
            <p className="text-slate-400 font-medium">Niciun concurs deschis momentan.</p>
          </div>
        )}
      </section>

      {/* Înscrierea mea */}
      {myEvents.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Înscrierea mea</h2>
          <div className="space-y-3">
            {myEvents.map(({ event, registrations }) => (
              <Link
                key={event.id}
                href={`/concursuri/${event.id}`}
                className="block bg-white rounded-2xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-sm transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-slate-900">{event.name} — Ediția {event.edition}</p>
                    <p className="text-sm text-slate-500">{new Date(event.date).toLocaleDateString('ro-RO')} · {event.location}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                    registrations.every((r: any) => r.paid)
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {registrations.every((r: any) => r.paid) ? 'Plătit' : 'Plată în așteptare'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {registrations.map((reg: any, i: number) => (
                    <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                      {reg.swimmers?.full_name} · {reg.event_probes?.stroke}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
