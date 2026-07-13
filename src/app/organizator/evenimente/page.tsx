/* eslint-disable @typescript-eslint/no-explicit-any -- interogări Supabase încă netipizate */
import { createClient } from '@/lib/supabase/server'
import { CalendarDays, MapPin, Plus } from 'lucide-react'
import { Badge, ButtonLink, Card, CardLink, EmptyState, PageHeader } from '@/components/ui'

export default async function EvenimentePage() {
  const supabase = await createClient()
  const sb = supabase as any

  const { data: events } = await sb
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
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 rounded-none border-0 first:rounded-t-2xl last:rounded-b-2xl hover:bg-slate-50 hover:shadow-none"
            >
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate">
                  {event.name} <span className="text-slate-400 font-normal">Ediția {event.edition}</span>
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" aria-hidden />
                    {new Date(event.date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" aria-hidden />
                      {event.location}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {event.registration_open && <Badge variant="info">Înscrieri deschise</Badge>}
                {event.seeding_done && <Badge variant="success">Serii generate</Badge>}
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
          title="Niciun eveniment creat."
          description="Creează primul concurs — poți invita cluburi, genera serii și cronometra live."
          action={
            <ButtonLink href="/organizator/evenimente/nou">
              <Plus className="w-4 h-4" />
              Eveniment nou
            </ButtonLink>
          }
        />
      )}
    </div>
  )
}
