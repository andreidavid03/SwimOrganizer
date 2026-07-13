'use client'

/* eslint-disable @typescript-eslint/no-explicit-any -- interogări Supabase încă netipizate */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Input, Label, Select, Card, FormError } from '@/components/ui'
import { Plus } from 'lucide-react'

export default function AddCategoryForm({ eventId }: { eventId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    label: '',
    gender: 'F',
    age_group_min: '4',
    age_group_max: '12',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // Auto-generează label
  function autoLabel() {
    const min = form.age_group_min
    const max = parseInt(form.age_group_max) >= 99 ? 'Open' : `${form.age_group_max} ani`
    const gen = form.gender === 'F' ? 'Fete' : 'Băieți'
    return `${min}-${max} ${gen}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const sb = createClient() as any

    const label = form.label.trim() || autoLabel()
    const { error: err } = await sb.from('event_categories').insert({
      event_id: eventId,
      label,
      gender: form.gender,
      age_group_min: parseInt(form.age_group_min),
      age_group_max: parseInt(form.age_group_max),
    })

    if (err) { setError(err.message); setLoading(false); return }
    setForm({ label: '', gender: 'F', age_group_min: '4', age_group_max: '12' })
    setLoading(false)
    router.refresh()
  }

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <Label htmlFor="gender">Gen</Label>
            <Select id="gender" name="gender" value={form.gender} onChange={handleChange}>
              <option value="F">Fete</option>
              <option value="M">Băieți</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="age_group_min">Vârstă min</Label>
            <Input id="age_group_min" name="age_group_min" type="number" min="4" max="20" value={form.age_group_min} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="age_group_max">Vârstă max</Label>
            <Input id="age_group_max" name="age_group_max" type="number" min="4" max="99" value={form.age_group_max} onChange={handleChange} placeholder="99=Open" />
          </div>
          <div>
            <Label htmlFor="label">Denumire (opțional)</Label>
            <Input id="label" name="label" value={form.label} onChange={handleChange} placeholder={autoLabel()} />
          </div>
        </div>
        <FormError>{error}</FormError>
        <Button type="submit" disabled={loading} variant="secondary">
          <Plus className="w-4 h-4" />
          {loading ? 'Se adaugă...' : 'Adaugă categorie'}
        </Button>
      </form>
    </Card>
  )
}
