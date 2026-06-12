import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 py-14 px-6 text-center">
      <Icon className="w-10 h-10 text-slate-300 mx-auto mb-3" strokeWidth={1.5} aria-hidden />
      <p className="font-medium text-slate-500">{title}</p>
      {description && <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}
