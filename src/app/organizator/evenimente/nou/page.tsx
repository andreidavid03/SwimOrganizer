'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, ButtonLink, Card, FormError, Input, Label, PageHeader, Select } from '@/components/ui'

export default function EvenimentNouPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    edition: '1',
    date: '',
    time: '09:00',
    location: '',
    entry_fee: '0',
    lanes_count: '8',
    registration_deadline: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Nu ești autentificat.')
      setLoading(false)
      return
    }

    const { data: event, error: insertError } = await supabase
      .from('events')
      .insert({
        name: form.name.trim(),
        edition: parseInt(form.edition),
        date: form.date,
        time: form.time,
        location: form.location.trim(),
        entry_fee: parseFloat(form.entry_fee) || 0,
        lanes_count: parseInt(form.lanes_count),
        registration_deadline: form.registration_deadline || null,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (insertError || !event) {
      setError(insertError?.message || 'Eroare la crearea evenimentului.')
      setLoading(false)
      return
    }

    // Adaugă organizatorul ca rol pe eveniment
    await supabase.from('user_event_roles').insert({
      user_id: user.id,
      event_id: event.id,
      role: 'organizator',
      assigned_by: user.id,
    })

    router.push(`/organizator/evenimente/${event.id}`)
    router.refresh()
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Eveniment nou" backHref="/organizator/evenimente" backLabel="Evenimente" />

      <Card className="p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label htmlFor="name">Numele concursului <span className="text-red-500">*</span></Label>
              <Input id="name" name="name" value={form.name} onChange={handleChange} required placeholder="ex: Cupa Mării Negre" />
            </div>

            <div>
              <Label htmlFor="edition">Ediția</Label>
              <Input id="edition" name="edition" type="number" min="1" value={form.edition} onChange={handleChange} />
            </div>

            <div>
              <Label htmlFor="lanes_count">Culoare bazin</Label>
              <Select id="lanes_count" name="lanes_count" value={form.lanes_count} onChange={handleChange}>
                {[4,5,6,7,8,9,10].map(n => (
                  <option key={n} value={n}>{n} culoare</option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="date">Data <span className="text-red-500">*</span></Label>
              <Input id="date" name="date" type="date" value={form.date} onChange={handleChange} required />
            </div>

            <div>
              <Label htmlFor="time">Ora start</Label>
              <Input id="time" name="time" type="time" value={form.time} onChange={handleChange} />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="location">Locație <span className="text-red-500">*</span></Label>
              <Input id="location" name="location" value={form.location} onChange={handleChange} required placeholder="ex: Bazinul Olimpic București" />
            </div>

            <div>
              <Label htmlFor="entry_fee">Taxă de participare (lei/participant)</Label>
              <Input id="entry_fee" name="entry_fee" type="number" min="0" step="0.5" value={form.entry_fee} onChange={handleChange} />
            </div>

            <div>
              <Label htmlFor="registration_deadline">Termen limită înscrieri</Label>
              <Input id="registration_deadline" name="registration_deadline" type="datetime-local" value={form.registration_deadline} onChange={handleChange} />
            </div>
          </div>

          <FormError>{error}</FormError>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <ButtonLink href="/organizator/evenimente" variant="ghost">Anulează</ButtonLink>
            <Button type="submit" disabled={loading}>
              {loading ? 'Se creează...' : 'Creează eveniment'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
