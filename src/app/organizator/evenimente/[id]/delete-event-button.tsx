'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2 } from 'lucide-react'
import { Button, FormError } from '@/components/ui'

export default function DeleteEventButton({
  eventId, eventName, hasRegistrations,
}: { eventId: string; eventName: string; hasRegistrations: boolean }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setLoading(true)
    setError(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any
    const { error } = await supabase.from('events').delete().eq('id', eventId)
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push('/organizator/evenimente')
    router.refresh()
  }

  if (!confirming) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setConfirming(true)} className="text-red-600 hover:bg-red-50">
        <Trash2 className="w-4 h-4" aria-hidden />
        Șterge evenimentul
      </Button>
    )
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
      <p className="text-sm font-semibold text-red-800 mb-1">Ștergi „{eventName}”?</p>
      <p className="text-xs text-red-600 mb-3">
        {hasRegistrations
          ? 'Atenție: există înscrieri. Se vor șterge definitiv categoriile, probele, înscrierile și seriile.'
          : 'Se șterg definitiv categoriile și probele. Acțiunea nu poate fi anulată.'}
      </p>
      <FormError>{error}</FormError>
      <div className="flex gap-2 mt-2">
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>Anulează</Button>
        <Button variant="danger" size="sm" disabled={loading} onClick={handleDelete}>
          {loading ? 'Se șterge...' : 'Da, șterge definitiv'}
        </Button>
      </div>
    </div>
  )
}
