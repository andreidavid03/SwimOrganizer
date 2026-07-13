'use client'

/* eslint-disable @typescript-eslint/no-explicit-any -- interogări Supabase încă netipizate */
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Badge, Button } from '@/components/ui'
import { Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react'

const STROKE_LABELS: Record<string, string> = {
  crawl: 'Procedeu Crawl',
  spate: 'Procedeu Spate',
  bras: 'Procedeu Bras',
  crawl_pluta: 'Crawl cu plută',
  crawl_ajutatoare: 'Crawl cu ajutătoare',
}

const STROKE_OPTIONS = Object.entries(STROKE_LABELS)

export default function CategoryList({ categories }: { categories: any[] }) {
  const router = useRouter()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [addingProbe, setAddingProbe] = useState<string | null>(null)
  const [newStroke, setNewStroke] = useState('crawl')

  async function deleteCategory(catId: string) {
    if (!confirm('Ștergi categoria și toate probele din ea?')) return
    const sb = createClient() as any
    await sb.from('event_categories').delete().eq('id', catId)
    router.refresh()
  }

  async function deleteProbe(probeId: string) {
    const sb = createClient() as any
    await sb.from('event_probes').delete().eq('id', probeId)
    router.refresh()
  }

  async function addProbe(catId: string) {
    const sb = createClient() as any
    await sb.from('event_probes').insert({
      category_id: catId,
      stroke: newStroke,
      has_float: newStroke === 'crawl_pluta',
      order_index: 99,
    })
    setAddingProbe(null)
    router.refresh()
  }

  if (categories.length === 0) {
    return (
      <p className="text-slate-400 text-sm py-6 text-center bg-white rounded-2xl border border-slate-200">
        Nicio categorie definită. Folosește configurarea rapidă sau adaugă manual.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {categories.map((cat: any) => (
        <div key={cat.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {/* Header categorie */}
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50"
            onClick={() => setExpanded(expanded === cat.id ? null : cat.id)}
          >
            <div className="flex items-center gap-3">
              <Badge variant={cat.gender === 'F' ? 'info' : 'neutral'}>
                {cat.gender === 'F' ? 'Fete' : 'Băieți'}
              </Badge>
              <span className="font-semibold text-slate-800">{cat.label}</span>
              <span className="text-xs text-slate-400">{cat.event_probes?.length ?? 0} probe</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={e => { e.stopPropagation(); deleteCategory(cat.id) }}
                className="text-slate-300 hover:text-red-400 transition p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              {expanded === cat.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </div>

          {/* Probe */}
          {expanded === cat.id && (
            <div className="border-t border-slate-100 px-4 py-3 space-y-2">
              {cat.event_probes?.sort((a: any, b: any) => a.order_index - b.order_index).map((probe: any) => (
                <div key={probe.id} className="flex items-center justify-between text-sm py-1">
                  <span className="text-slate-700">{STROKE_LABELS[probe.stroke] ?? probe.stroke}</span>
                  <button
                    onClick={() => deleteProbe(probe.id)}
                    className="text-slate-300 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {addingProbe === cat.id ? (
                <div className="flex gap-2 mt-2">
                  <select
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    value={newStroke}
                    onChange={e => setNewStroke(e.target.value)}
                  >
                    {STROKE_OPTIONS.map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                  <Button size="sm" onClick={() => addProbe(cat.id)}>Adaugă</Button>
                  <Button size="sm" variant="ghost" onClick={() => setAddingProbe(null)}>Anulează</Button>
                </div>
              ) : (
                <button
                  onClick={() => setAddingProbe(cat.id)}
                  className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 mt-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Adaugă probă
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
