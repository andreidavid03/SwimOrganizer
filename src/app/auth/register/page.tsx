'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'
import { Logo } from '@/components/logo'
import { Button, Input, Label, Select, FormError } from '@/components/ui'

type Club = Database['public']['Tables']['clubs']['Row']

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [clubs, setClubs] = useState<Club[]>([])
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', clubId: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('clubs').select('*').order('name').then(({ data }) => {
      if (data) setClubs(data)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (signUpError || !data.user) {
      setError(signUpError?.message || 'Eroare la înregistrare.')
      setLoading(false)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: profileError } = await (supabase as any)
      .from('profiles')
      .update({ full_name: form.fullName, phone: form.phone, club_id: form.clubId || null })
      .eq('id', data.user.id)

    if (profileError) {
      setError('Cont creat, dar eroare la salvarea profilului.')
      setLoading(false)
      return
    }

    router.push('/concursuri')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="mb-8">
            <Logo tone="dark" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Cont nou</h1>
          <p className="text-slate-400">Creează-ți contul pentru a te înscrie la concursuri</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <Label tone="dark" htmlFor="fullName">Nume complet</Label>
            <Input tone="dark" id="fullName" name="fullName" type="text" value={form.fullName} onChange={handleChange} required placeholder="Ion Popescu" />
          </div>
          <div>
            <Label tone="dark" htmlFor="email">Email</Label>
            <Input tone="dark" id="email" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="email@exemplu.ro" />
          </div>
          <div>
            <Label tone="dark" htmlFor="phone">Telefon</Label>
            <Input tone="dark" id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} required placeholder="07xx xxx xxx" />
          </div>
          <div>
            <Label tone="dark" htmlFor="clubId">
              Club <span className="text-slate-500 font-normal">(opțional)</span>
            </Label>
            <Select tone="dark" id="clubId" name="clubId" value={form.clubId} onChange={handleChange}>
              <option value="">{clubs.length === 0 ? 'Niciun club disponibil momentan' : 'Alege clubul'}</option>
              {clubs.map(club => (
                <option key={club.id} value={club.id}>{club.name}{club.city ? ` — ${club.city}` : ''}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label tone="dark" htmlFor="password">Parolă</Label>
            <Input tone="dark" id="password" name="password" type="password" value={form.password} onChange={handleChange} required minLength={6} placeholder="Minim 6 caractere" />
          </div>

          <FormError tone="dark">{error}</FormError>

          <Button type="submit" size="lg" disabled={loading} className="w-full">
            {loading ? 'Se creează contul...' : 'Creează cont'}
          </Button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-6">
          Ai deja cont?{' '}
          <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium transition">Autentifică-te</Link>
        </p>
      </div>
    </div>
  )
}
