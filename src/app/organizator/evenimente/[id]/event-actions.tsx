'use client'

/* eslint-disable @typescript-eslint/no-explicit-any -- interogări Supabase încă netipizate */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
import { Eye, EyeOff, ClipboardList } from 'lucide-react'

export default function EventActions({ event }: { event: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function toggle(field: string, value: boolean) {
    setLoading(field)
    const sb = createClient() as any
    await sb.from('events').update({ [field]: value }).eq('id', event.id)
    router.refresh()
    setLoading(null)
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant={event.published ? 'secondary' : 'primary'}
        onClick={() => toggle('published', !event.published)}
        disabled={loading === 'published'}
      >
        {event.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        {event.published ? 'Ascunde (Draft)' : 'Publică evenimentul'}
      </Button>

      <Button
        variant={event.registration_open ? 'secondary' : 'primary'}
        onClick={() => toggle('registration_open', !event.registration_open)}
        disabled={loading === 'registration_open'}
      >
        <ClipboardList className="w-4 h-4" />
        {event.registration_open ? 'Închide înscrierile' : 'Deschide înscrierile'}
      </Button>
    </div>
  )
}
