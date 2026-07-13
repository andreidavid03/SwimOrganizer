/* eslint-disable @typescript-eslint/no-explicit-any -- interogări Supabase încă netipizate */
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  CalendarDays, ExternalLink, ListOrdered, ListChecks, MapPin,
  Pencil, Timer, Trophy, UsersRound, ChevronRight,
} from 'lucide-react'
import { Badge, Card, ButtonLink, PageHeader } from '@/components/ui'
import EventActions from './event-actions'
import PaymentsList from './payments-list'
import DeleteEventButton from './delete-event-button'

export default async function EvenimentAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const sb = supabase as any

  const { data: event } = await sb.from('events').select('*').eq('id', id).single()
  if (!event) notFound()

  const { data: categories } = await sb
    .from('event_categories')
    .select(`
      id, label,
      event_probes(
        id, stroke,
        registrations(id, paid, swimmers(id, full_name, birth_year, clubs(name)))
      )
    `)
    .eq('event_id', id)

  const probeCount = (categories ?? []).reduce((n: number, c: any) => n + (c.event_probes?.length ?? 0), 0)

  // Toate înscrierile, grupate pe sportiv (pentru plăți)
  const allRegistrations = (categories ?? []).flatMap((c: any) =>
    (c.event_probes ?? []).flatMap((p: any) =>
      (p.registrations ?? []).map((r: any) => ({ ...r, probe: p, category: c }))
    )
  )
  const bySwimmer = new Map<string, { swimmer: any; regs: any[] }>()
  allRegistrations.forEach((r: any) => {
    if (!r.swimmers) return
    if (!bySwimmer.has(r.swimmers.id)) bySwimmer.set(r.swimmers.id, { swimmer: r.swimmers, regs: [] })
    bySwimmer.get(r.swimmers.id)!.regs.push(r)
  })
  const swimmerGroups = Array.from(bySwimmer.values())
  const paidCount = allRegistrations.filter((r: any) => r.paid).length

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={`${event.name} — Ediția ${event.edition}`}
        backHref="/organizator/evenimente"
        backLabel="Evenimente"
        action={
          <ButtonLink href={`/organizator/evenimente/${id}/editare`} variant="secondary" size="sm">
            <Pencil className="w-4 h-4" aria-hidden />
            Editează
          </ButtonLink>
        }
      />

      {/* Status + acțiuni publicare/înscrieri */}
      <Card className="p-5 mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant={event.published ? 'success' : 'warning'}>
            {event.published ? 'Publicat' : 'Draft'}
          </Badge>
          <Badge variant={event.registration_open ? 'info' : 'neutral'}>
            {event.registration_open ? 'Înscrieri deschise' : 'Înscrieri închise'}
          </Badge>
          {event.seeding_done && <Badge variant="neutral">Serii generate</Badge>}
        </div>
        <p className="text-sm text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1 mb-4">
          <span className="flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5" aria-hidden />
            {new Date(event.date).toLocaleDateString('ro-RO')} · {event.time?.slice(0, 5)}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" aria-hidden />
            {event.location}
          </span>
          <span>{event.entry_fee} lei / probă · {event.lanes_count} culoare</span>
        </p>
        <EventActions event={event} />
        {!event.published && (
          <p className="text-xs text-slate-400 mt-3">Finalizează categoriile și probele înainte de a deschide înscrierile.</p>
        )}
      </Card>

      {/* Navigare către sub-pagini */}
      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        <HubLink
          href={`/organizator/evenimente/${id}/categorii`}
          icon={ListChecks}
          title="Categorii & Probe"
          subtitle={`${categories?.length ?? 0} categorii · ${probeCount} probe`}
        />
        <HubLink
          href={`/organizator/evenimente/${id}/echipa`}
          icon={UsersRound}
          title="Echipă & Invitații"
          subtitle="Antrenori, cronometrori, staff"
        />
        <HubLink
          href={`/organizator/evenimente/${id}/serii`}
          icon={ListOrdered}
          title="Serii & Cronometraj"
          subtitle={event.seeding_done ? 'Serii generate' : 'Negenerate încă'}
        />
        <HubLink
          href={`/concursuri/${id}/rezultate`}
          icon={Trophy}
          title="Rezultate"
          subtitle="Clasament pe probe și vârste"
        />
      </div>

      {/* Legături publice rapide */}
      {event.published && (
        <div className="flex flex-wrap gap-2 mb-8">
          <ButtonLink href={`/concursuri/${id}`} variant="ghost" size="sm">
            <ExternalLink className="w-4 h-4" aria-hidden />
            Pagina publică
          </ButtonLink>
          {event.seeding_done && (
            <>
              <ButtonLink href={`/concursuri/${id}/serii`} variant="ghost" size="sm">
                <ListOrdered className="w-4 h-4" aria-hidden />
                Liste de start
              </ButtonLink>
              <ButtonLink href={`/organizator/evenimente/${id}/serii`} variant="ghost" size="sm">
                <Timer className="w-4 h-4" aria-hidden />
                Cronometraj
              </ButtonLink>
            </>
          )}
        </div>
      )}

      {/* Înscrieri & plăți */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">
          Înscrieri & plăți{' '}
          <span className="text-slate-400 font-normal">
            ({allRegistrations.length} probe · {paidCount} plătite)
          </span>
        </h2>
        <PaymentsList groups={swimmerGroups} entryFee={event.entry_fee} />
      </section>

      {/* Zonă periculoasă */}
      <section className="border-t border-slate-200 pt-6">
        <DeleteEventButton eventId={id} eventName={event.name} hasRegistrations={allRegistrations.length > 0} />
      </section>
    </div>
  )
}

function HubLink({ href, icon: Icon, title, subtitle }: {
  href: string
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  title: string
  subtitle: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 bg-white rounded-2xl border border-slate-200 p-4 hover:border-brand-300 hover:shadow-sm transition"
    >
      <span className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="font-semibold text-slate-900 group-hover:text-brand-700 transition">{title}</p>
        <p className="text-xs text-slate-500 truncate">{subtitle}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 ml-auto shrink-0" aria-hidden />
    </Link>
  )
}
