'use client'

/* eslint-disable @typescript-eslint/no-explicit-any -- interogări Supabase încă netipizate */
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Pencil, Plus, Trash2, Waves } from 'lucide-react'
import { GENDER_LABELS } from '@/lib/labels'
import { Badge, Button, Card, EmptyState, FormError, Input, Label, PageHeader, Select } from '@/components/ui'

type Swimmer = { id: string; full_name: string; birth_year: number; gender: 'M' | 'F'; club_id: string; clubs: { name: string } | null }
type Club = { id: string; name: string; city: string }

const currentYear = new Date().getFullYear()
const emptyForm = { fullName: '', birthYear: '', gender: 'M', clubId: '' }

export default function SportiviiMeiPage() {
  const supabase = createClient() as any

  const [swimmers, setSwimmers] = useState<Swimmer[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [loaded, setLoaded] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [{ data: sw }, { data: cl }] = await Promise.all([
      supabase.from('swimmers').select('id, full_name, birth_year, gender, club_id, clubs(name)').order('full_name'),
      supabase.from('clubs').select('id, name, city').order('name'),
    ])
    setSwimmers(sw ?? [])
    setClubs(cl ?? [])
    setLoaded(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // setState se întâmplă după await, nu sincron — fals pozitiv
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  function openAdd() {
    setEditingId(null)
    setForm(emptyForm)
    setError(null)
    setShowForm(true)
  }

  function openEdit(s: Swimmer) {
    setEditingId(s.id)
    setForm({ fullName: s.full_name, birthYear: String(s.birth_year), gender: s.gender, clubId: s.club_id })
    setError(null)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      full_name: form.fullName.trim(),
      birth_year: Number(form.birthYear),
      gender: form.gender,
      club_id: form.clubId,
    }

    let error
    if (editingId) {
      ({ error } = await supabase.from('swimmers').update(payload).eq('id', editingId))
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      ;({ error } = await supabase.from('swimmers').insert({ ...payload, parent_id: user?.id }))
    }

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
    setSaving(false)
    load()
  }

  async function handleDelete(id: string) {
    setDeletingId(null)
    setError(null)
    const { error } = await supabase.from('swimmers').delete().eq('id', id)
    // Foreign key restrict → sportivul are înscrieri
    if (error) {
      setError('Nu poți șterge un sportiv care are deja înscrieri la concursuri.')
      return
    }
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
            <Button onClick={openAdd}>
              <Plus className="w-4 h-4" aria-hidden />
              Adaugă sportiv
            </Button>
          )
        }
      />

      {showForm && (
        <Card className="p-5 sm:p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-4">{editingId ? 'Editează sportivul' : 'Sportiv nou'}</h2>
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
              <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setEditingId(null) }}>Anulează</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Se salvează...' : editingId ? 'Salvează modificările' : 'Salvează sportivul'}</Button>
            </div>
          </form>
        </Card>
      )}

      {!showForm && error && <div className="mb-4"><FormError>{error}</FormError></div>}

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
              <div className="ml-auto flex items-center gap-1 shrink-0">
                <Badge variant="neutral">{currentYear - s.birth_year} ani</Badge>
                <button
                  title="Editează"
                  onClick={() => openEdit(s)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition"
                >
                  <Pencil className="w-4 h-4" aria-hidden />
                </button>
                {deletingId === s.id ? (
                  <button
                    title="Confirmă ștergerea"
                    onClick={() => handleDelete(s.id)}
                    className="h-10 px-2 flex items-center justify-center rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-500 transition"
                  >
                    Sigur?
                  </button>
                ) : (
                  <button
                    title="Șterge"
                    onClick={() => setDeletingId(s.id)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden />
                  </button>
                )}
              </div>
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
              <Button onClick={openAdd}>
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
