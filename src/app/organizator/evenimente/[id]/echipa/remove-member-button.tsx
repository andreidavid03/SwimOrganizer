'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2 } from 'lucide-react'

export default function RemoveMemberButton({ roleId }: { roleId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function remove() {
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any
    await supabase.from('user_event_roles').delete().eq('id', roleId)
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      title="Scoate din echipă"
      disabled={loading}
      onClick={remove}
      className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition shrink-0 disabled:opacity-50"
    >
      <Trash2 className="w-4 h-4" aria-hidden />
    </button>
  )
}
