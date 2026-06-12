/* eslint-disable @typescript-eslint/no-explicit-any -- interogări Supabase încă netipizate */
import { createClient } from '@/lib/supabase/server'
import { CalendarDays, ClipboardList, MapPin } from 'lucide-react'
import { STROKE_LABELS } from '@/lib/labels'
import { Badge, ButtonLink, CardLink, EmptyState } from '@/components/ui'

export default async function InscrierileMelePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const sb = supabase as any

  const { data: myRegistrations } = await sb
    .from('registrations')
    .select(`
      id, registered_at, paid,
      swimmers(full_name),
      event_probes(
        stroke,
        event_categories(
          label,
          events(id, name, edition, date, location, entry_fee)
        )
      )
    `)
    .in('swimmer_id',
      (await sb.from('swimmers').select('id').eq('parent_id', user?.id)).data?.map((s: any) => s.id) || []
    )
    .order('registered_at', { ascending: false })

  // Grupează pe eveniment
  const eventMap = new Map<string, { event: any; registrations: any[] }>()
  myRegistrations?.forEach((reg: any) => {
    const event = reg.event_probes?.event_categories?.events
    if (!event) return
    if (!eventMap.has(event.id)) eventMap.set(event.id, { event, registrations: [] })
    eventMap.get(event.id)!.registrations.push(reg)
  })
  const myEvents = Array.from(eventMap.values())

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Înscrierile mele</h1>

      {myEvents.length > 0 ? (
        <div className="space-y-3">
          {myEvents.map(({ event, registrations }) => {
            const allPaid = registrations.every((r: any) => r.paid)
            const total = registrations.length * Number(event.entry_fee ?? 0)
            return (
              <CardLink key={event.id} href={`/concursuri/${event.id}`} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
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
                  <Badge variant={allPaid ? 'success' : 'warning'}>
                    {allPaid ? 'Plătit' : 'Plată în așteptare'}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {registrations.map((reg: any) => (
                    <Badge key={reg.id} variant="neutral">
                      {reg.swimmers?.full_name} · {STROKE_LABELS[reg.event_probes?.stroke as keyof typeof STROKE_LABELS] ?? reg.event_probes?.stroke}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm font-semibold text-slate-700 pt-3 border-t border-slate-100">
                  Total: {total} lei ({registrations.length} {registrations.length === 1 ? 'probă' : 'probe'})
                </p>
              </CardLink>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="Nicio înscriere încă."
          description="Alege un concurs deschis și înscrie-ți sportivii."
          action={<ButtonLink href="/concursuri" variant="secondary">Vezi concursurile</ButtonLink>}
        />
      )}
    </div>
  )
}
