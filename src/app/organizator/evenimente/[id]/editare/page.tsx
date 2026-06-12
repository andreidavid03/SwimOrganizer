'use client'

/* eslint-disable @typescript-eslint/no-explicit-any -- interogări Supabase încă netipizate */
import { use, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, ButtonLink, Card, FormError, Input, Label, PageHeader, Select } from '@/components/ui'

export default function EditareEvenimentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient() as any

  const [form, setForm] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data: ev } = await supabase.from('events').select('*').eq('id', id).single()
    if (ev) {
      setForm({
        name: ev.name,
        edition: String(ev.edition),
        date: ev.date,
        time: ev.time?.slice(0, 5) ?? '09:00',
        location: ev.location,
        entryFee: String(ev.entry_fee),
        lanesCount: String(ev.lanes_count),
        registrationDeadline: ev.registration_deadline
          ? new Date(ev.registration_deadline).toISOString().slice(0, 16)
          : '',
      })
    }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // setState se întâmplă după await, nu sincron — fals pozitiv
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev: any) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase
      .from('events')
      .update({
        name: form.name.trim(),
        edition: Number(form.edition),
        date: form.date,
        time: form.time,
        location: form.location.trim(),
        entry_fee: Number(form.entryFee),
        lanes_count: Number(form.lanesCount),
        registration_deadline: form.registrationDeadline ? new Date(form.registrationDeadline).toISOString() : null,
      })
      .eq('id', id)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(`/organizator/evenimente/${id}`)
    router.refresh()
  }

  if (!form) return <p className="text-slate-400 text-center py-16">Se încarcă...</p>

  return (
    <div className="max-w-lg">
      <PageHeader title="Editează evenimentul" backHref={`/organizator/evenimente/${id}`} backLabel="Eveniment" />

      <Card className="p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="name">Numele concursului <span className="text-red-500">*</span></Label>
            <Input id="name" name="name" value={form.name} onChange={handleChange} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edition">Ediția</Label>
              <Input id="edition" name="edition" type="number" min={1} value={form.edition} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="lanesCount">Culoare</Label>
              <Select id="lanesCount" name="lanesCount" value={form.lanesCount} onChange={handleChange}>
                {[4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n} culoare</option>)}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="date">Data <span className="text-red-500">*</span></Label>
              <Input id="date" name="date" type="date" value={form.date} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="time">Ora de start</Label>
              <Input id="time" name="time" type="time" value={form.time} onChange={handleChange} required />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Locația <span className="text-red-500">*</span></Label>
            <Input id="location" name="location" value={form.location} onChange={handleChange} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="entryFee">Taxă / probă (lei)</Label>
              <Input id="entryFee" name="entryFee" type="number" min={0} step="0.01" value={form.entryFee} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="registrationDeadline">Termen înscrieri</Label>
              <Input id="registrationDeadline" name="registrationDeadline" type="datetime-local" value={form.registrationDeadline} onChange={handleChange} />
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Setările (categorii, probe, taxă) trebuie finalizate înainte de a deschide înscrierile —
            schimbarea lor după ce există înscrieri poate produce inconsistențe.
          </p>

          <FormError>{error}</FormError>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <ButtonLink href={`/organizator/evenimente/${id}`} variant="ghost">Anulează</ButtonLink>
            <Button type="submit" disabled={loading}>
              {loading ? 'Se salvează...' : 'Salvează modificările'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
