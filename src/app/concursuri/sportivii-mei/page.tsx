'use client'

/* eslint-disable @typescript-eslint/no-explicit-any -- interogări Supabase încă netipizate */
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Waves } from 'lucide-react'
import { GENDER_LABELS } from '@/lib/labels'
import { Badge, Button, Card, EmptyState, FormError, Input, Label, PageHeader, Select } from '@/components/ui'

type Swimmer = { id: string; full_name: string; birth_year: number; gender: 'M' | 'F'; clubs: { name: string } | null }
type Club = { id: string; name: string; city: string }

const currentYear = new Date().getFullYear()

export default function SportiviiMeiPage() {
  const supabase = createClient() as any

  const [swimmers, setSwimmers] = useState<Swimmer[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [loaded, setLoaded] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ fullName: '', birthYear: '', gender: 'M', clubId: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [{ data: sw }, { data: cl }] = await Promise.all([
      supabase.from('swimmers').select('id, full_name, birth_year, gender, clubs(name)').order('full_name'),
      supabase.from('clubs').select('id, name, city').order('name'),
    ])
    setSwimmers(sw ?? [])
    setClubs(cl ?? [])
    setLoaded(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // setState se întâmplă după await, nu sincron — fals pozitiv
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('swimmers').insert({
      full_name: form.fullName.trim(),
      birth_year: Number(form.birthYear),
      gender: form.gender,
      club_id: form.clubId,
      parent_id: user?.id,
    })

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    setForm({ fullName: '', birthYear: '', gender: 'M', clubId: '' })
    setShowForm(false)
    setSaving(false)
    load()
  }

  if (!loaded) return <p className="text-slate-400 text-center py-16">Se încarcă...</p>

  return (
    <div>
      <PageHeader
        title="Sportivii mei"
        description="Copiii pe care îi poți înscrie la concursuri"
        action={
          !showForm && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4" aria-hidden />
              Adaugă sportiv
            </Button>
          )
        }
      />

      {showForm && (
        <Card className="p-5 sm:p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="fullName">Nume complet</Label>
              <Input id="fullName" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} required placeholder="ex: Maria Popescu" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="birthYear">An naștere</Label>
                <Select id="birthYear" value={form.birthYear} onChange={e => setForm(f => ({ ...f, birthYear: e.target.value }))} required>
                  <option value="">Alege</option>
                  {Array.from({ length: 18 }, (_, i) => currentYear - 4 - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="gender">Gen</Label>
                <Select id="gender" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                  <option value="M">Băiat</option>
                  <option value="F">Fată</option>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="clubId">Club</Label>
              <Select id="clubId" value={form.clubId} onChange={e => setForm(f => ({ ...f, clubId: e.target.value }))} required>
                <option value="">{clubs.length === 0 ? 'Niciun club disponibil' : 'Alege clubul'}</option>
                {clubs.map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.city ? ` — ${c.city}` : ''}</option>
                ))}
              </Select>
            </div>

            <FormError>{error}</FormError>

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Anulează</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Se salvează...' : 'Salvează sportivul'}</Button>
            </div>
          </form>
        </Card>
      )}

      {swimmers.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {swimmers.map(s => (
            <Card key={s.id} className="p-5 flex items-center gap-4">
              <span className="w-11 h-11 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                <Waves className="w-5 h-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate">{s.full_name}</p>
                <p className="text-sm text-slate-500">
                  {s.birth_year} · {GENDER_LABELS[s.gender]}{s.clubs?.name ? ` · ${s.clubs.name}` : ''}
                </p>
              </div>
              <Badge variant="neutral" className="ml-auto shrink-0">{currentYear - s.birth_year} ani</Badge>
            </Card>
          ))}
        </div>
      ) : (
        !showForm && (
          <EmptyState
            icon={Waves}
            title="Niciun sportiv adăugat încă."
            description="Adaugă-ți copilul pentru a-l putea înscrie la concursuri."
            action={
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4" aria-hidden />
                Adaugă sportiv
              </Button>
            }
          />
        )
      )}
    </div>
  )
}
