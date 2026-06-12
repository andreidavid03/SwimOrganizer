import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CalendarDays, ClipboardList, MapPin, Plus, Trophy, UsersRound, Waves } from 'lucide-react'
import { Logo } from '@/components/logo'
import { Badge, CardLink, EmptyState } from '@/components/ui'

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
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 h-14 flex items-center justify-between sticky top-0 z-10">
        <Logo href="/dashboard" />
        <div className="flex items-center gap-4">
          <span className="text-slate-500 text-sm hidden sm:block">
            {profile?.clubs && typeof profile.clubs === 'object' && 'name' in profile.clubs
              ? (profile.clubs as { name: string }).name
              : ''}
          </span>
          <form action="/auth/logout" method="post">
            <button className="text-slate-500 text-sm hover:text-slate-900 transition px-3 py-2 rounded-lg">
              Ieșire
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          Bună ziua, {firstName}!
        </h1>
        <p className="text-slate-500 mb-8">Ce dorești să faci astăzi?</p>

        {/* Acțiuni rapide */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10">
          <QuickAction href="/parinte/inotatori" icon={<Waves className="w-6 h-6" aria-hidden />} label="Înotătorii mei" />
          <QuickAction href="/parinte/inscrieri" icon={<ClipboardList className="w-6 h-6" aria-hidden />} label="Înscrieri" />
          <QuickAction href="/rezultate" icon={<Trophy className="w-6 h-6" aria-hidden />} label="Rezultate" />
          <Link
            href="/organizator/eveniment-nou"
            className="bg-brand-600 rounded-2xl p-4 text-center hover:bg-brand-500 transition flex flex-col items-center gap-2"
          >
            <span className="w-11 h-11 rounded-xl bg-white/15 text-white flex items-center justify-center">
              <Plus className="w-6 h-6" aria-hidden />
            </span>
            <p className="text-sm font-medium text-white">Competiție nouă</p>
          </Link>
        </div>

        {/* Evenimentele mele ca organizator */}
        {ownedEvents && ownedEvents.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Competiții organizate de tine</h2>
            <div className="space-y-3">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {ownedEvents.map((event: any) => (
                <CardLink key={event.id} href={`/organizator/evenimente/${event.id}`} className="px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {event.name} — Ediția {event.edition}
                      </p>
                      <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" aria-hidden />
                          {event.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5" aria-hidden />
                          {new Date(event.date).toLocaleDateString('ro-RO')}
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={event.published ? 'success' : 'warning'}>
                        {event.published ? 'Publicat' : 'Draft'}
                      </Badge>
                      {event.registration_open && <Badge variant="info">Înscrieri deschise</Badge>}
                    </div>
                  </div>
                </CardLink>
              ))}
            </div>
          </section>
        )}

        {/* Roluri la alte evenimente */}
        {userRoles && userRoles.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-4">Rolurile mele la competiții</h2>
            <div className="space-y-3">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {userRoles.map((ur: any, i: number) => {
                const event = ur.events as { id: string; name: string; edition: number; date: string; location: string } | null
                if (!event) return null
                const roleLabels: Record<string, string> = {
                  organizator: 'Organizator',
                  antrenor: 'Antrenor',
                  cronometror: 'Cronometror',
                  staff: 'Staff margine',
                  parinte: 'Părinte',
                }
                return (
                  <CardLink key={i} href={`/eveniment/${event.id}`} className="px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {event.name} — Ediția {event.edition}
                        </p>
                        <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5" aria-hidden />
                          {new Date(event.date).toLocaleDateString('ro-RO')}
                        </p>
                      </div>
                      <Badge variant="neutral">{roleLabels[ur.role] || ur.role}</Badge>
                    </div>
                  </CardLink>
                )
              })}
            </div>
          </section>
        )}

        {(!ownedEvents || ownedEvents.length === 0) && (!userRoles || userRoles.length === 0) && (
          <EmptyState
            icon={UsersRound}
            title="Nu ești înscris la nicio competiție încă."
            description="Creează o competiție sau înscrie-ți copilul la un eveniment disponibil."
          />
        )}
      </div>
    </div>
  )
}

function QuickAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="bg-white rounded-2xl border border-slate-200 p-4 text-center hover:border-brand-300 hover:shadow-sm transition flex flex-col items-center gap-2"
    >
      <span className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
        {icon}
      </span>
      <p className="text-sm font-medium text-slate-700">{label}</p>
    </Link>
  )
}
