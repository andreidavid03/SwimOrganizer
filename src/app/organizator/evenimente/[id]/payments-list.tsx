'use client'

/* eslint-disable @typescript-eslint/no-explicit-any -- interogări Supabase încă netipizate */
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { STROKE_LABELS } from '@/lib/labels'
import { Badge, Button, Card } from '@/components/ui'

type SwimmerGroup = { swimmer: any; regs: any[] }

export default function PaymentsList({ groups, entryFee }: { groups: SwimmerGroup[]; entryFee: number }) {
  const router = useRouter()
  const supabase = createClient() as any
  const [busy, setBusy] = useState<string | null>(null)

  async function togglePaid(group: SwimmerGroup) {
    setBusy(group.swimmer.id)
    const allPaid = group.regs.every(r => r.paid)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('registrations')
      .update(allPaid
        ? { paid: false, paid_at: null, payment_confirmed_by: null }
        : { paid: true, paid_at: new Date().toISOString(), payment_confirmed_by: user?.id })
      .in('id', group.regs.map(r => r.id))
    setBusy(null)
    router.refresh()
  }

  if (groups.length === 0) {
    return <p className="text-sm text-slate-400">Nicio înscriere încă. Apar aici după ce părinții înscriu sportivii.</p>
  }

  return (
    <div className="space-y-3">
      {groups.map(group => {
        const { swimmer, regs } = group
        const allPaid = regs.every(r => r.paid)
        const total = regs.length * Number(entryFee ?? 0)
        return (
          <Card key={swimmer.id} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div>
                <p className="font-semibold text-slate-900">{swimmer.full_name}</p>
                <p className="text-xs text-slate-400">
                  {swimmer.birth_year}{swimmer.clubs?.name ? ` · ${swimmer.clubs.name}` : ''} · total {total} lei
                </p>
              </div>
              <Button
                size="sm"
                variant={allPaid ? 'secondary' : 'primary'}
                disabled={busy !== null}
                onClick={() => togglePaid(group)}
              >
                {allPaid ? 'Anulează plata' : 'Marchează plătit'}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {regs.map(r => (
                <Badge key={r.id} variant={r.paid ? 'success' : 'warning'}>
                  {STROKE_LABELS[r.probe.stroke as keyof typeof STROKE_LABELS]} · {r.category.label}
                </Badge>
              ))}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
