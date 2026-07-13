/* eslint-disable @typescript-eslint/no-explicit-any -- interogări Supabase încă netipizate */
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/ui'
import CategoryList from './category-list'
import AddCategoryForm from './add-category-form'

export default async function CategoriiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const sb = supabase as any

  const { data: event } = await sb.from('events').select('id, name, edition, lanes_count').eq('id', id).single()
  if (!event) notFound()

  const { data: categories } = await sb
    .from('event_categories')
    .select(`
      id, label, gender, age_group_min, age_group_max, birth_year,
      event_probes(id, stroke, has_float, order_index)
    `)
    .eq('event_id', id)
    .order('age_group_min')

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Categorii & Probe"
        backHref={`/organizator/evenimente/${id}`}
        backLabel={`${event.name} Ed.${event.edition}`}
      />

      {/* Template rapid */}
      <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 mb-6">
        <p className="text-sm font-semibold text-brand-800 mb-1">Configurare rapidă</p>
        <p className="text-xs text-brand-600 mb-3">
          Generează automat categoriile standard (4-7, 8-12, 13+ Open) cu probele aferente.
        </p>
        <QuickSetupButton eventId={id} />
      </div>

      {/* Lista categorii existente */}
      <CategoryList categories={categories ?? []} />

      {/* Adaugă categorie manuală */}
      <div className="mt-6">
        <h2 className="text-base font-semibold text-slate-800 mb-3">Adaugă categorie</h2>
        <AddCategoryForm eventId={id} />
      </div>
    </div>
  )
}

// Server component wrapper pentru butonul quick setup
import QuickSetupButton from './quick-setup-button'
