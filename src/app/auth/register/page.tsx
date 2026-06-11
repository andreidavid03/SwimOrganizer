'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

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

  const inputClass = "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
  const labelClass = "block text-sm font-medium text-slate-300 mb-2"

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-500 rounded-lg" />
            <span className="text-white font-semibold text-lg tracking-tight">SwimOrganizer</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Cont nou</h1>
          <p className="text-slate-400">Creează-ți contul pentru a te înscrie la concursuri</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className={labelClass}>Nume complet</label>
            <input name="fullName" type="text" value={form.fullName} onChange={handleChange} required className={inputClass} placeholder="Ion Popescu" />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required className={inputClass} placeholder="email@exemplu.ro" />
          </div>
          <div>
            <label className={labelClass}>Telefon</label>
            <input name="phone" type="tel" value={form.phone} onChange={handleChange} required className={inputClass} placeholder="07xx xxx xxx" />
          </div>
          <div>
            <label className={labelClass}>Club <span className="text-slate-500 font-normal">(opțional)</span></label>
            <select name="clubId" value={form.clubId} onChange={handleChange} className={inputClass + " bg-slate-800"}>
              <option value="">{clubs.length === 0 ? 'Niciun club disponibil momentan' : 'Alege clubul'}</option>
              {clubs.map(club => (
                <option key={club.id} value={club.id}>{club.name}{club.city ? ` — ${club.city}` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Parolă</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} required minLength={6} className={inputClass} placeholder="Minim 6 caractere" />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50">
            {loading ? 'Se creează contul...' : 'Creează cont'}
          </button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-6">
          Ai deja cont?{' '}
          <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 font-medium transition">Autentifică-te</Link>
        </p>
      </div>
    </div>
  )
}
