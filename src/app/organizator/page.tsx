import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard organizator</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon="🏊" label="Cluburi" value={clubsCount ?? 0} href="/organizator/cluburi" />
        <StatCard icon="📅" label="Evenimente" value={eventsCount ?? 0} href="/organizator/evenimente" />
        <StatCard icon="👥" label="Utilizatori" value={usersCount ?? 0} href="/organizator/utilizatori" />
      </div>

      {/* Acțiuni rapide */}
      <div className="flex gap-3 mb-8 flex-wrap">
        <Link
          href="/organizator/cluburi/nou"
          className="bg-blue-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          + Club nou
        </Link>
        <Link
          href="/organizator/evenimente/nou"
          className="bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-green-600 transition"
        >
          + Eveniment nou
        </Link>
      </div>

      {/* Evenimente recente */}
      {recentEvents && recentEvents.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Evenimente recente</h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {recentEvents.map((event: any) => (
              <Link
                key={event.id}
                href={`/organizator/evenimente/${event.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition"
              >
                <div>
                  <p className="font-medium text-gray-900">{event.name} — Ediția {event.edition}</p>
                  <p className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString('ro-RO')}</p>
                </div>
                <div className="flex gap-2">
                  {event.registration_open && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Înscrieri deschise</span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full ${event.published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {event.published ? 'Publicat' : 'Draft'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, href }: { icon: string; label: string; value: number; href: string }) {
  return (
    <Link href={href} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
      <div className="text-2xl mb-1">{icon}</div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </Link>
  )
}
