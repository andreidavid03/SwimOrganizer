/* eslint-disable @typescript-eslint/no-explicit-any -- interogări Supabase încă netipizate */
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Mail, UsersRound } from 'lucide-react'
import { ROLE_LABELS } from '@/lib/labels'
import { Badge, Card, EmptyState, PageHeader } from '@/components/ui'
import InviteForm from '../invite-form'
import RemoveMemberButton from './remove-member-button'
import InvitationRow from './invitation-row'

export default async function EchipaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const sb = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  const { data: event } = await sb.from('events').select('id, name, edition').eq('id', id).single()
  if (!event) notFound()

  const [{ data: roles }, { data: invitations }] = await Promise.all([
    sb.from('user_event_roles')
      .select('id, role, user_id, profiles:user_id(full_name, phone)')
      .eq('event_id', id)
      .order('created_at'),
    sb.from('event_invitations')
      .select('id, email, role, token, accepted_at, created_at')
      .eq('event_id', id)
      .order('created_at', { ascending: false }),
  ])

  const pending = (invitations ?? []).filter((i: any) => !i.accepted_at)

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Echipă & Invitații"
        description={`${event.name} — Ediția ${event.edition}`}
        backHref={`/organizator/evenimente/${id}`}
        backLabel="Eveniment"
      />

      {/* Invitare */}
      <Card className="p-5 mb-6">
        <h2 className="font-semibold text-slate-900 mb-1">Invită o persoană</h2>
        <p className="text-sm text-slate-500 mb-4">
          Generează un link de invitație și trimite-l pe WhatsApp sau email. Antrenorii pot fi adăugați
          oricând; cronometrorii și staff-ul se pot repartiza chiar și în ziua concursului.
        </p>
        <InviteForm eventId={id} invitedBy={user!.id} />
      </Card>

      {/* Membri activi */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">
          Echipa activă <span className="text-slate-400 font-normal">({roles?.length ?? 0})</span>
        </h2>
        {roles && roles.length > 0 ? (
          <Card className="divide-y divide-slate-100">
            {roles.map((m: any) => (
              <div key={m.id} className="flex items-center gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 truncate">
                    {m.profiles?.full_name || 'Utilizator'}
                  </p>
                  {m.profiles?.phone && <p className="text-xs text-slate-400 truncate">{m.profiles.phone}</p>}
                </div>
                <Badge variant={m.role === 'organizator' ? 'info' : 'neutral'} className="ml-auto shrink-0">
                  {ROLE_LABELS[m.role as keyof typeof ROLE_LABELS] ?? m.role}
                </Badge>
                {m.role !== 'organizator' && <RemoveMemberButton roleId={m.id} />}
              </div>
            ))}
          </Card>
        ) : (
          <EmptyState icon={UsersRound} title="Nimeni în echipă încă." description="Invită antrenori și ajutoare mai sus." />
        )}
      </section>

      {/* Invitații în așteptare */}
      {pending.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-3">
            Invitații în așteptare <span className="text-slate-400 font-normal">({pending.length})</span>
          </h2>
          <Card className="divide-y divide-slate-100">
            {pending.map((inv: any) => (
              <InvitationRow key={inv.id} invitation={inv} />
            ))}
          </Card>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <Mail className="w-3.5 h-3.5" aria-hidden />
            Invitația devine „activă” după ce persoana o acceptă din link.
          </p>
        </section>
      )}
    </div>
  )
}
