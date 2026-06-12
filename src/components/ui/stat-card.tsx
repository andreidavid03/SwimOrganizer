import type { LucideIcon } from 'lucide-react'
import { CardLink } from './card'

export function StatCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon
  label: string
  value: number | string
  href: string
}) {
  return (
    <CardLink href={href} className="p-5">
      <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5" aria-hidden />
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </CardLink>
  )
}
