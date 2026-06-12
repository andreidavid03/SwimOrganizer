'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, ButtonLink, Card, FormError, Input, Label, PageHeader } from '@/components/ui'

export default function ClubNouPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', city: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any
    const { error } = await supabase
      .from('clubs')
      .insert({ name: form.name.trim(), city: form.city.trim() })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/organizator/cluburi')
    router.refresh()
  }

  return (
    <div className="max-w-lg">
      <PageHeader title="Club nou" backHref="/organizator/cluburi" backLabel="Cluburi" />

      <Card className="p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="name">
              Numele clubului <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="ex: CS Neptun București"
            />
          </div>

          <div>
            <Label htmlFor="city">Oraș</Label>
            <Input
              id="city"
              name="city"
              type="text"
              value={form.city}
              onChange={handleChange}
              placeholder="ex: București"
            />
          </div>

          <FormError>{error}</FormError>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <ButtonLink href="/organizator/cluburi" variant="ghost">
              Anulează
            </ButtonLink>
            <Button type="submit" disabled={loading}>
              {loading ? 'Se salvează...' : 'Salvează club'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
