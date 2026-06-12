'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/logo'
import { Button, Input, Label, FormError } from '@/components/ui'

export default function LoginPage() {
  // useSearchParams cere un boundary de Suspense la prerender
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/concursuri'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email sau parolă incorectă.')
      setLoading(false)
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="mb-8">
            <Logo tone="dark" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Bun venit</h1>
          <p className="text-slate-400">Intră în contul tău pentru a continua</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label tone="dark" htmlFor="email">Email</Label>
            <Input
              tone="dark"
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="email@exemplu.ro"
            />
          </div>

          <div>
            <Label tone="dark" htmlFor="password">Parolă</Label>
            <Input
              tone="dark"
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <FormError tone="dark">{error}</FormError>

          <Button type="submit" size="lg" disabled={loading} className="w-full mt-2">
            {loading ? 'Se încarcă...' : 'Autentificare'}
          </Button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-6">
          Nu ai cont?{' '}
          <Link href="/auth/register" className="text-brand-400 hover:text-brand-300 font-medium transition">
            Înregistrează-te
          </Link>
        </p>
      </div>
    </div>
  )
}
