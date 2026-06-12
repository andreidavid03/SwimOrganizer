import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  action,
  backHref,
  backLabel,
}: {
  title: string
  description?: string
  action?: ReactNode
  backHref?: string
  backLabel?: string
}) {
  return (
    <div className="mb-6">
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition mb-2 -ml-1 py-1 pr-2 print:hidden"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden />
          {backLabel ?? 'Înapoi'}
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {description && <p className="text-slate-500 mt-1">{description}</p>}
        </div>
        {action && <div className="flex items-center gap-3">{action}</div>}
      </div>
    </div>
  )
}
