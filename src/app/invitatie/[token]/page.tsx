import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card } from '@/components/ui'
import { Logo } from '@/components/logo'
import AcceptInviteButton from './accept-button'

export default async function InvitatiePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const { data: inv } = await sb
    .from('event_invitations')
    .select('id, email, role, accepted_at, event_id, events(name, edition, date, location)')
    .eq('token', token)
    .single()

  if (!inv) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center text-white">
          <Logo tone="dark" href="/" />
          <p className="mt-6 text-slate-400">Link de invitație invalid sau expirat.</p>
        </div>
      </div>
    )
  }

  const { data: { user } } = await supabase.auth.getUser()

  const event = inv.events
  const roleLabels: Record<string, string> = {
    antrenor: 'Antrenor',
    cronometror: 'Cronometror',
    staff: 'Staff / Margine',
    organizator: 'Co-organizator',
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo tone="dark" href="/" />
        </div>

        <Card className="p-6">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Invitație la concurs</h1>
          <p className="text-slate-500 text-sm mb-6">
            Ești invitat să participi ca <strong>{roleLabels[inv.role] ?? inv.role}</strong> la:
          </p>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
            <p className="font-semibold text-slate-900">{event.name} — Ediția {event.edition}</p>
            <p className="text-sm text-slate-500 mt-1">
              {new Date(event.date).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p className="text-sm text-slate-500">{event.location}</p>
          </div>

          {inv.accepted_at ? (
            <div className="text-center py-4">
              <p className="text-green-600 font-semibold">Invitație deja acceptată.</p>
              {user && (
                <Link href="/concursuri" className="block mt-3 text-brand-600 text-sm hover:underline">
                  Mergi la aplicație →
                </Link>
              )}
            </div>
          ) : user ? (
            <AcceptInviteButton invitationId={inv.id} eventId={inv.event_id} role={inv.role} userId={user.id} />
          ) : (
            <div className="space-y-3 text-center">
              <p className="text-sm text-slate-500">Trebuie să ai un cont pentru a accepta invitația.</p>
              <a
                href={`/auth/register?redirectTo=/invitatie/${token}`}
                className="block w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-3 rounded-xl transition text-center"
              >
                Creează cont și acceptă
              </a>
              <a
                href={`/auth/login?redirectTo=/invitatie/${token}`}
                className="block w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium py-3 rounded-xl transition text-center"
              >
                Am deja cont — Autentifică-te
              </a>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
