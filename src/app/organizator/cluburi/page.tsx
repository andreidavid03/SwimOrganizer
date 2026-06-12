import { createClient } from '@/lib/supabase/server'
import { Building2, MapPin, Plus } from 'lucide-react'
import { ButtonLink, Card, CardLink, EmptyState, PageHeader } from '@/components/ui'

export default async function CluburiPage() {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: clubs } = await (supabase as any)
    .from('clubs')
    .select('id, name, city, created_at')
    .order('name')

  return (
    <div>
      <PageHeader
        title="Cluburi"
        action={
          <ButtonLink href="/organizator/cluburi/nou">
            <Plus className="w-4 h-4" aria-hidden />
            Club nou
          </ButtonLink>
        }
      />

      {clubs && clubs.length > 0 ? (
        <Card className="divide-y divide-slate-100">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {clubs.map((club: any) => (
            <CardLink
              key={club.id}
              href={`/organizator/cluburi/${club.id}`}
              className="flex items-center justify-between px-5 py-4 rounded-none border-0 first:rounded-t-2xl last:rounded-b-2xl hover:bg-slate-50 hover:shadow-none"
            >
              <div>
                <p className="font-semibold text-slate-900">{club.name}</p>
                {club.city && (
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" aria-hidden />
                    {club.city}
                  </p>
                )}
              </div>
              <span className="text-sm text-slate-400">
                {new Date(club.created_at).toLocaleDateString('ro-RO')}
              </span>
            </CardLink>
          ))}
        </Card>
      ) : (
        <EmptyState
          icon={Building2}
          title="Niciun club adăugat încă."
          action={
            <ButtonLink href="/organizator/cluburi/nou" variant="secondary">
              <Plus className="w-4 h-4" aria-hidden />
              Adaugă primul club
            </ButtonLink>
          }
        />
      )}
    </div>
  )
}
