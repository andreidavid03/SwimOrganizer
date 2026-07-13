'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { Shuffle, CheckCircle } from 'lucide-react'

export default function GenerateHeatsButton({
  eventId, lanesCount, done,
}: { eventId: string; lanesCount: number; done: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handle() {
    if (!confirm('Generezi seriile? Eventualele serii existente vor fi șterse și recreate.')) return
    setLoading(true)
    const res = await fetch(`/api/events/${eventId}/seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lanesCount }),
    })
    setLoading(false)
    if (res.ok) router.refresh()
    else alert('Eroare la generarea seriilor.')
  }

  return (
    <Button onClick={handle} disabled={loading} variant={done ? 'secondary' : 'primary'}>
      {done ? <CheckCircle className="w-4 h-4" /> : <Shuffle className="w-4 h-4" />}
      {loading ? 'Se generează...' : done ? 'Regenerează serii' : 'Generează serii'}
    </Button>
  )
}
