'use client'

/* eslint-disable @typescript-eslint/no-explicit-any -- interogări Supabase încă netipizate */
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, Copy, Trash2 } from 'lucide-react'
import { ROLE_LABELS } from '@/lib/labels'
import { Badge } from '@/components/ui'

export default function InvitationRow({ invitation }: { invitation: any }) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  async function copy() {
    const link = `${window.location.origin}/invitatie/${invitation.token}`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function remove() {
    setLoading(true)
    const supabase = createClient() as any
    await supabase.from('event_invitations').delete().eq('id', invitation.id)
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <div className="min-w-0">
        <p className="font-medium text-slate-900 truncate">{invitation.email}</p>
        <p className="text-xs text-slate-400">invitat pe {new Date(invitation.created_at).toLocaleDateString('ro-RO')}</p>
      </div>
      <Badge variant="neutral" className="ml-auto shrink-0">
        {ROLE_LABELS[invitation.role as keyof typeof ROLE_LABELS] ?? invitation.role}
      </Badge>
      <button
        onClick={copy}
        title="Copiază linkul invitației"
        className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition shrink-0"
      >
        {copied ? <Check className="w-4 h-4" aria-hidden /> : <Copy className="w-4 h-4" aria-hidden />}
      </button>
      <button
        onClick={remove}
        disabled={loading}
        title="Anulează invitația"
        className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition shrink-0 disabled:opacity-50"
      >
        <Trash2 className="w-4 h-4" aria-hidden />
      </button>
    </div>
  )
}
