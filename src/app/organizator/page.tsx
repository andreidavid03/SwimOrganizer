import { createClient } from '@/lib/supabase/server'
import { Building2, CalendarDays, UsersRound, Plus } from 'lucide-react'
import { Badge, ButtonLink, Card, CardLink, PageHeader, StatCard } from '@/components/ui'

export default async function OrganizatorDashboard() {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const [{ count: clubsCount }, { count: eventsCount }, { count: usersCount }] = await Promise.all([
    sb.from('clubs').select('*', { count: 'exact', head: true }),
    sb.from('events').select('*', { count: 'exact', head: true }),
    sb.from('profiles').select('*', { count: 'exact', head: true }),
  ])

  const { data: recentEvents } = await sb
    .from('events')
    .select('id, name, edition, date, published, registration_open')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div>
      <PageHeader title="Dashboard organizator" />

      {/* Statistici */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
        <StatCard icon={Building2} label="Cluburi" value={clubsCount ?? 0} href="/organizator/cluburi" />
        <StatCard icon={CalendarDays} label="Evenimente" value={eventsCount ?? 0} href="/organizator/evenimente" />
        <StatCard icon={UsersRound} label="Utilizatori" value={usersCount ?? 0} href="/organizator/utilizatori" />
      </div>

      {/* Acțiuni rapide */}
      <div className="flex gap-3 mb-8 flex-wrap">
        <ButtonLink href="/organizator/cluburi/nou">
          <Plus className="w-4 h-4" aria-hidden />
          Club nou
        </ButtonLink>
        <ButtonLink href="/organizator/evenimente/nou" variant="secondary">
          <Plus className="w-4 h-4" aria-hidden />
          Eveniment nou
        </ButtonLink>
      </div>

      {/* Evenimente recente */}
      {recentEvents && recentEvents.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-3">Evenimente recente</h2>
          <Card className="divide-y divide-slate-100">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {recentEvents.map((event: any) => (
              <CardLink
                key={event.id}
                href={`/organizator/evenimente/${event.id}`}
                className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 rounded-none border-0 first:rounded-t-2xl last:rounded-b-2xl hover:bg-slate-50 hover:shadow-none"
              >
                <div>
                  <p className="font-medium text-slate-900">{event.name} — Ediția {event.edition}</p>
                  <p className="text-sm text-slate-500">{new Date(event.date).toLocaleDateString('ro-RO')}</p>
                </div>
                <div className="flex gap-2">
                  {event.registration_open && <Badge variant="info">Înscrieri deschise</Badge>}
                  <Badge variant={event.published ? 'success' : 'warning'}>
                    {event.published ? 'Publicat' : 'Draft'}
                  </Badge>
                </div>
              </CardLink>
            ))}
          </Card>
        </section>
      )}
    </div>
  )
}
