'use client'

/* eslint-disable @typescript-eslint/no-explicit-any -- interogări Supabase încă netipizate */
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
import { CheckCircle } from 'lucide-react'

export default function AcceptInviteButton({
  invitationId, eventId, role, userId,
}: {
  invitationId: string
  eventId: string
  role: string
  userId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function accept() {
    setLoading(true)
    const sb = createClient() as any

    // Adaugă rolul pe eveniment
    const { error: roleErr } = await sb.from('user_event_roles').upsert({
      user_id: userId,
      event_id: eventId,
      role,
    }, { onConflict: 'user_id,event_id,role' })

    if (roleErr) {
      setError('Eroare la acceptarea invitației.')
      setLoading(false)
      return
    }

    // Marchează invitația ca acceptată
    await sb.from('event_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitationId)

    setDone(true)
    setTimeout(() => router.push('/concursuri'), 1500)
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-green-600">
        <CheckCircle className="w-10 h-10" />
        <p className="font-semibold">Invitație acceptată! Te redirecționăm...</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <Button onClick={accept} disabled={loading} size="lg" className="w-full">
        {loading ? 'Se procesează...' : 'Acceptă invitația'}
      </Button>
    </div>
  )
}
