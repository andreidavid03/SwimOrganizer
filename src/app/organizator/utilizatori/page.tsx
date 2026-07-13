/* eslint-disable @typescript-eslint/no-explicit-any -- interogări Supabase încă netipizate */
import { createClient } from '@/lib/supabase/server'
import { UsersRound } from 'lucide-react'
import { Badge, Card, EmptyState, PageHeader } from '@/components/ui'

export default async function UtilizatoriPage() {
  const supabase = await createClient()
  const { data: profiles } = await (supabase as any)
    .from('profiles')
    .select('id, full_name, phone, is_admin, created_at, clubs(name)')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Utilizatori"
        description="Toate conturile din platformă. Rolurile pe eveniment se atribuie din pagina fiecărui eveniment → Echipă."
      />

      {profiles && profiles.length > 0 ? (
        <Card className="divide-y divide-slate-100">
          {profiles.map((p: any) => (
            <div key={p.id} className="flex flex-wrap items-center gap-2 px-5 py-4">
              <div className="min-w-0">
                <p className="font-medium text-slate-900 truncate">{p.full_name || 'Fără nume'}</p>
                <p className="text-xs text-slate-400 truncate">
                  {p.phone || '—'}{p.clubs?.name ? ` · ${p.clubs.name}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-auto shrink-0">
                {p.is_admin && <Badge variant="info">Admin</Badge>}
                <span className="text-xs text-slate-400">
                  {new Date(p.created_at).toLocaleDateString('ro-RO')}
                </span>
              </div>
            </div>
          ))}
        </Card>
      ) : (
        <EmptyState icon={UsersRound} title="Niciun utilizator." />
      )}
    </div>
  )
}
