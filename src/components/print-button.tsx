'use client'

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui'

/** Printează pagina curentă — din dialogul de print se poate salva și ca PDF. */
export function PrintButton({ label = 'Printează / PDF' }: { label?: string }) {
  return (
    <Button variant="secondary" onClick={() => window.print()} className="print:hidden">
      <Printer className="w-4 h-4" aria-hidden />
      {label}
    </Button>
  )
}
