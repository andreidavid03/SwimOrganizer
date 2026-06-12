'use client'

/* eslint-disable @typescript-eslint/no-explicit-any -- interogări Supabase încă netipizate */
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, ButtonLink, Card, FormError, Input, Label, PageHeader, Select } from '@/components/ui'

export default function EvenimentNouPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    edition: '1',
    date: '',
    time: '09:00',
    location: '',
    entryFee: '50',
    lanesCount: '6',
    registrationDeadline: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient() as any
    const { data: { user } } = await supabase.auth.getUser()

    const { data: event, error } = await supabase
      .from('events')
      .insert({
        name: form.name.trim(),
        edition: Number(form.edition),
        date: form.date,
        time: form.time,
        location: form.location.trim(),
        entry_fee: Number(form.entryFee),
        lanes_count: Number(form.lanesCount),
        registration_deadline: form.registrationDeadline ? new Date(form.registrationDeadline).toISOString() : null,
        created_by: user?.id,
      })
      .select('id')
      .single()

    if (error || !event) {
      setError(error?.message ?? 'Eroare la crearea evenimentului.')
      setLoading(false)
      return
    }

    // Creatorul primește rolul de organizator — necesar pentru RLS
    // (vizibilitatea înscrierilor și a sportivilor, marcarea plăților).
    await supabase.from('user_event_roles').insert({
      user_id: user?.id,
      event_id: event.id,
      role: 'organizator',
    })

    router.push(`/organizator/evenimente/${event.id}`)
    router.refresh()
  }

  return (
    <div className="max-w-lg">
      <PageHeader title="Eveniment nou" backHref="/organizator/evenimente" backLabel="Evenimente" />

      <Card className="p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="name">Numele concursului <span className="text-red-500">*</span></Label>
            <Input id="name" name="name" value={form.name} onChange={handleChange} required placeholder="ex: Cupa Delfinul" />
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
            <Input id="location" name="location" value={form.location} onChange={handleChange} required placeholder="ex: Bazinul Olimpic, Cluj-Napoca" />
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

          <FormError>{error}</FormError>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <ButtonLink href="/organizator/evenimente" variant="ghost">Anulează</ButtonLink>
            <Button type="submit" disabled={loading}>
              {loading ? 'Se creează...' : 'Creează evenimentul'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
