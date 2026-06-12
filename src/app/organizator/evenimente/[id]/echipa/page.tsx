'use client'

/* eslint-disable @typescript-eslint/no-explicit-any -- interogări Supabase încă netipizate */
import { use, useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trash2, UserPlus, UsersRound } from 'lucide-react'
import { ROLE_LABELS } from '@/lib/labels'
import { Badge, Button, Card, EmptyState, FormError, Input, Label, PageHeader, Select } from '@/components/ui'

// Rolurile pe care organizatorul le poate atribui echipei.
// Lista finală de roluri (asistent culoare, asistent copii etc.) se stabilește
// cu clientul — adăugarea unui rol nou = o migrare pe enum-ul user_role.
const ASSIGNABLE_ROLES = ['antrenor', 'cronometror', 'staff', 'organizator'] as const

export default function EchipaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient() as any

  const [event, setEvent] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)
  const [form, setForm] = useState({ email: '', role: 'antrenor' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [{ data: ev }, { data: roles }] = await Promise.all([
      supabase.from('events').select('id, name, edition').eq('id', id).single(),
      supabase.from('user_event_roles')
        .select('id, role, user_id, profiles:user_id(full_name, email, phone)')
        .eq('event_id', id)
        .order('created_at'),
    ])
    setEvent(ev)
    setMembers(roles ?? [])
    setLoaded(true)
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // setState se întâmplă după await, nu sincron — fals pozitiv
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  async function addMember(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)

    // Caută utilizatorul după email (funcție SECURITY DEFINER — migrarea 004)
    const { data: found, error: findError } = await supabase
      .rpc('find_profile_by_email', { p_email: form.email.trim() })

    if (findError) {
      setError(findError.message)
      setBusy(false)
      return
    }
    if (!found || found.length === 0) {
      setError(`Niciun cont cu emailul „${form.email.trim()}". Persoana trebuie să-și creeze întâi cont în aplicație.`)
      setBusy(false)
      return
    }

    const profile = found[0]
    if (members.some(m => m.user_id === profile.id && m.role === form.role)) {
      setInfo(`${profile.full_name || profile.email} are deja rolul „${ROLE_LABELS[form.role as keyof typeof ROLE_LABELS]}".`)
      setBusy(false)
      return
    }

    const { error } = await supabase.from('user_event_roles').insert({
      user_id: profile.id,
      event_id: id,
      role: form.role,
    })

    if (error) {
      setError(error.message)
      setBusy(false)
      return
    }

    setForm(f => ({ ...f, email: '' }))
    setBusy(false)
    load()
  }

  async function removeMember(roleId: string) {
    setBusy(true)
    setError(null)
    const { error } = await supabase.from('user_event_roles').delete().eq('id', roleId)
    if (error) setError(error.message)
    setBusy(false)
    load()
  }

  if (!loaded) return <p className="text-slate-400 text-center py-16">Se încarcă...</p>
  if (!event) return <EmptyState icon={UsersRound} title="Evenimentul nu a fost găsit." />

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Echipa evenimentului"
        description={`${event.name} — Ediția ${event.edition}`}
        backHref={`/organizator/evenimente/${id}`}
        backLabel="Eveniment"
      />

      {/* Adăugare membru */}
      <Card className="p-5 mb-6">
        <form onSubmit={addMember} className="space-y-4">
          <div className="grid sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
            <div>
              <Label htmlFor="email">Emailul persoanei</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                placeholder="antrenor@exemplu.ro"
              />
            </div>
            <div>
              <Label htmlFor="role">Rol</Label>
              <Select id="role" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="sm:w-44">
                {ASSIGNABLE_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </Select>
            </div>
            <Button type="submit" disabled={busy}>
              <UserPlus className="w-4 h-4" aria-hidden />
              Adaugă
            </Button>
          </div>
          <p className="text-xs text-slate-400">
            Persoana trebuie să aibă deja cont în aplicație. Antrenorii pot fi adăugați oricând;
            rolurile pentru ziua concursului (cronometror, staff) se pot repartiza și în ultima zi.
          </p>
        </form>
      </Card>

      <FormError>{error}</FormError>
      {info && (
        <div className="bg-brand-50 border border-brand-200 text-brand-700 text-sm px-4 py-3 rounded-xl mb-4">{info}</div>
      )}

      {/* Membrii echipei */}
      {members.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="Nimeni în echipă încă."
          description="Adaugă antrenorii și ajutoarele după emailul contului lor."
        />
      ) : (
        <Card className="divide-y divide-slate-100 mt-2">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-3 px-5 py-4">
              <div className="min-w-0">
                <p className="font-medium text-slate-900 truncate">
                  {m.profiles?.full_name || m.profiles?.email || 'Utilizator necunoscut'}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {m.profiles?.email}{m.profiles?.phone ? ` · ${m.profiles.phone}` : ''}
                </p>
              </div>
              <Badge variant={m.role === 'organizator' ? 'info' : 'neutral'} className="ml-auto shrink-0">
                {ROLE_LABELS[m.role as keyof typeof ROLE_LABELS] ?? m.role}
              </Badge>
              <button
                title="Scoate din echipă"
                disabled={busy}
                onClick={() => removeMember(m.id)}
                className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition shrink-0"
              >
                <Trash2 className="w-4 h-4" aria-hidden />
              </button>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
