/* eslint-disable @typescript-eslint/no-explicit-any -- interogări Supabase încă netipizate */
import { createClient } from '@/lib/supabase/server'
import { CalendarDays, MapPin, Plus } from 'lucide-react'
import { Badge, ButtonLink, Card, CardLink, EmptyState, PageHeader } from '@/components/ui'

export default async function EvenimentePage() {
  const supabase = await createClient()
  const { data: events } = await (supabase as any)
    .from('events')
    .select('id, name, edition, date, location, published, registration_open, seeding_done')
    .order('date', { ascending: false })

  return (
    <div>
      <PageHeader
        title="Evenimente"
        action={
          <ButtonLink href="/organizator/evenimente/nou">
            <Plus className="w-4 h-4" aria-hidden />
            Eveniment nou
          </ButtonLink>
        }
      />

      {events && events.length > 0 ? (
        <Card className="divide-y divide-slate-100">
          {events.map((event: any) => (
            <CardLink
              key={event.id}
              href={`/organizator/evenimente/${event.id}`}
              className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 rounded-none border-0 first:rounded-t-2xl last:rounded-b-2xl hover:bg-slate-50 hover:shadow-none"
            >
              <div>
                <p className="font-semibold text-slate-900">{event.name} — Ediția {event.edition}</p>
                <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" aria-hidden />
                    {new Date(event.date).toLocaleDateString('ro-RO')}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" aria-hidden />
                    {event.location}
                  </span>
                </p>
              </div>
              <div className="flex gap-2">
                {event.registration_open && <Badge variant="info">Înscrieri deschise</Badge>}
                {event.seeding_done && <Badge variant="neutral">Serii generate</Badge>}
                <Badge variant={event.published ? 'success' : 'warning'}>
                  {event.published ? 'Publicat' : 'Draft'}
                </Badge>
              </div>
            </CardLink>
          ))}
        </Card>
      ) : (
        <EmptyState
          icon={CalendarDays}
          title="Niciun eveniment creat încă."
          description="Creează primul concurs pentru a putea primi înscrieri."
          action={
            <ButtonLink href="/organizator/evenimente/nou">
              <Plus className="w-4 h-4" aria-hidden />
              Creează primul eveniment
            </ButtonLink>
          }
        />
      )}
    </div>
  )
}
