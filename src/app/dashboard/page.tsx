import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const { data: profile } = await sb
    .from('profiles')
    .select('*, clubs(name, city)')
    .eq('id', user.id)
    .single()

  const { data: userRoles } = await sb
    .from('user_event_roles')
    .select('role, events(id, name, edition, date, location, published)')
    .eq('user_id', user.id)

  const { data: ownedEvents } = await sb
    .from('events')
    .select('id, name, edition, date, location, published, registration_open')
    .eq('created_by', user.id)
    .order('date', { ascending: false })

  const firstName = profile?.full_name?.split(' ')[0] || 'utilizator'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-900 text-white px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏊</span>
          <span className="font-bold text-lg">SwimOrganizer</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-blue-200 text-sm hidden sm:block">
            {profile?.clubs && typeof profile.clubs === 'object' && 'name' in profile.clubs
              ? (profile.clubs as { name: string }).name
              : ''}
          </span>
          <form action="/auth/logout" method="post">
            <button className="text-blue-200 text-sm hover:text-white transition">
              Ieșire
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Bună ziua, {firstName}!
        </h1>
        <p className="text-gray-500 mb-8">Ce dorești să faci astăzi?</p>

        {/* Acțiuni rapide */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <Link href="/parinte/inotatori" className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md transition border border-gray-100">
            <div className="text-3xl mb-2">👶</div>
            <p className="text-sm font-medium text-gray-700">Înotătorii mei</p>
          </Link>
          <Link href="/parinte/inscrieri" className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md transition border border-gray-100">
            <div className="text-3xl mb-2">📋</div>
            <p className="text-sm font-medium text-gray-700">Înscrieri</p>
          </Link>
          <Link href="/rezultate" className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md transition border border-gray-100">
            <div className="text-3xl mb-2">🏆</div>
            <p className="text-sm font-medium text-gray-700">Rezultate</p>
          </Link>
          <Link href="/organizator/eveniment-nou" className="bg-blue-800 rounded-xl p-4 text-center shadow-sm hover:bg-blue-700 transition">
            <div className="text-3xl mb-2">➕</div>
            <p className="text-sm font-medium text-white">Competiție nouă</p>
          </Link>
        </div>

        {/* Evenimentele mele ca organizator */}
        {ownedEvents && ownedEvents.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Competiții organizate de tine</h2>
            <div className="space-y-3">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {ownedEvents.map((event: any) => (
                <Link
                  key={event.id}
                  href={`/organizator/evenimente/${event.id}`}
                  className="block bg-white rounded-xl px-5 py-4 shadow-sm hover:shadow-md transition border border-gray-100"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {event.name} — Ediția {event.edition}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        📍 {event.location} &nbsp;·&nbsp;
                        📅 {new Date(event.date).toLocaleDateString('ro-RO')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        event.published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {event.published ? 'Publicat' : 'Draft'}
                      </span>
                      {event.registration_open && (
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                          Înscrieri deschise
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Roluri la alte evenimente */}
        {userRoles && userRoles.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Rolurile mele la competiții</h2>
            <div className="space-y-3">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {userRoles.map((ur: any, i: number) => {
                const event = ur.events as { id: string; name: string; edition: number; date: string; location: string } | null
                if (!event) return null
                const roleLabels: Record<string, string> = {
                  organizator: '🛠 Organizator',
                  antrenor: '🧑‍🏫 Antrenor',
                  cronometror: '⏱ Cronometror',
                  staff: '🦺 Staff margine',
                  parinte: '👨‍👩‍👧 Părinte',
                }
                return (
                  <Link
                    key={i}
                    href={`/eveniment/${event.id}`}
                    className="block bg-white rounded-xl px-5 py-4 shadow-sm hover:shadow-md transition border border-gray-100"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {event.name} — Ediția {event.edition}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          📅 {new Date(event.date).toLocaleDateString('ro-RO')}
                        </p>
                      </div>
                      <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                        {roleLabels[ur.role] || ur.role}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {(!ownedEvents || ownedEvents.length === 0) && (!userRoles || userRoles.length === 0) && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">🏊</div>
            <p className="font-medium">Nu ești înscris la nicio competiție încă.</p>
            <p className="text-sm mt-1">Creează o competiție sau înscrie-ți copilul la un eveniment disponibil.</p>
          </div>
        )}
      </div>
    </div>
  )
}
