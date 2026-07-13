'use client'

/* eslint-disable @typescript-eslint/no-explicit-any -- interogări Supabase încă netipizate */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
import { Zap } from 'lucide-react'

const TEMPLATE = [
  // 4-7 ani
  {
    label: '4-7 ani Fete', gender: 'F', age_group_min: 4, age_group_max: 7,
    probes: [
      { stroke: 'crawl_pluta', has_float: true, order_index: 0 },
      { stroke: 'crawl_ajutatoare', has_float: false, order_index: 1 },
    ],
  },
  {
    label: '4-7 ani Băieți', gender: 'M', age_group_min: 4, age_group_max: 7,
    probes: [
      { stroke: 'crawl_pluta', has_float: true, order_index: 0 },
      { stroke: 'crawl_ajutatoare', has_float: false, order_index: 1 },
    ],
  },
  // 8-12 ani
  {
    label: '8-12 ani Fete', gender: 'F', age_group_min: 8, age_group_max: 12,
    probes: [
      { stroke: 'crawl', has_float: false, order_index: 0 },
      { stroke: 'spate', has_float: false, order_index: 1 },
    ],
  },
  {
    label: '8-12 ani Băieți', gender: 'M', age_group_min: 8, age_group_max: 12,
    probes: [
      { stroke: 'crawl', has_float: false, order_index: 0 },
      { stroke: 'spate', has_float: false, order_index: 1 },
    ],
  },
  // 13+ Open
  {
    label: '13+ Open Fete', gender: 'F', age_group_min: 13, age_group_max: 99,
    probes: [
      { stroke: 'crawl', has_float: false, order_index: 0 },
      { stroke: 'bras', has_float: false, order_index: 1 },
    ],
  },
  {
    label: '13+ Open Băieți', gender: 'M', age_group_min: 13, age_group_max: 99,
    probes: [
      { stroke: 'crawl', has_float: false, order_index: 0 },
      { stroke: 'bras', has_float: false, order_index: 1 },
    ],
  },
]

export default function QuickSetupButton({ eventId }: { eventId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSetup() {
    setLoading(true)
    const sb = createClient() as any

    for (const cat of TEMPLATE) {
      const { probes, ...catData } = cat
      const { data: newCat, error } = await sb
        .from('event_categories')
        .insert({ ...catData, event_id: eventId })
        .select('id')
        .single()

      if (!error && newCat) {
        await sb.from('event_probes').insert(
          probes.map(p => ({ ...p, category_id: newCat.id }))
        )
      }
    }

    setDone(true)
    setLoading(false)
    router.refresh()
  }

  return (
    <Button onClick={handleSetup} disabled={loading || done} variant={done ? 'secondary' : 'primary'}>
      <Zap className="w-4 h-4" />
      {done ? 'Categorii generate!' : loading ? 'Se generează...' : 'Generează categorii standard'}
    </Button>
  )
}
