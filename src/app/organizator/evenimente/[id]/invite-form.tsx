'use client'

/* eslint-disable @typescript-eslint/no-explicit-any -- interogări Supabase încă netipizate */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Input, Select, FormError } from '@/components/ui'
import { Send, Copy, Check } from 'lucide-react'

const ROLES = [
  { value: 'antrenor', label: 'Antrenor' },
  { value: 'cronometror', label: 'Cronometror' },
  { value: 'staff', label: 'Staff / Margine' },
  { value: 'organizator', label: 'Co-organizator' },
]

export default function InviteForm({ eventId, invitedBy }: { eventId: string; invitedBy: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('antrenor')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastLink, setLastLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)

    const sb = createClient() as any
    const { data, error: invErr } = await sb
      .from('event_invitations')
      .insert({
        event_id: eventId,
        email: email.trim().toLowerCase(),
        role,
        invited_by: invitedBy,
      })
      .select('token')
      .single()

    if (invErr) {
      setError(invErr.message.includes('unique') ? 'Acest email a fost deja invitat.' : invErr.message)
      setLoading(false)
      return
    }

    const link = `${window.location.origin}/invitatie/${data.token}`
    setLastLink(link)
    setEmail('')
    router.refresh()
    setLoading(false)
  }

  async function copyLink() {
    if (!lastLink) return
    await navigator.clipboard.writeText(lastLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleInvite} className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-48">
          <Input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="email@club.ro"
            required
          />
        </div>
        <div className="w-40">
          <Select value={role} onChange={e => setRole(e.target.value)}>
            {ROLES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </Select>
        </div>
        <Button type="submit" disabled={loading}>
          <Send className="w-4 h-4" />
          {loading ? 'Se trimite...' : 'Invită'}
        </Button>
      </form>

      <FormError>{error}</FormError>

      {lastLink && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-blue-700 font-medium mb-1">Link invitație generat — trimite-l pe WhatsApp sau email:</p>
            <p className="text-xs text-blue-600 truncate">{lastLink}</p>
          </div>
          <button
            onClick={copyLink}
            className="shrink-0 flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900 transition"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiat!' : 'Copiază'}
          </button>
        </div>
      )}
    </div>
  )
}
