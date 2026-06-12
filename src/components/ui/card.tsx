import Link from 'next/link'
import type { ComponentProps } from 'react'

export function Card({ className = '', ...props }: ComponentProps<'div'>) {
  return <div className={`bg-white rounded-2xl border border-slate-200 ${className}`} {...props} />
}

/** Card întreg clickabil — suprafața mare de atingere e pattern-ul preferat pe mobil. */
export function CardLink({ className = '', ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={`group block bg-white rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-sm transition ${className}`}
      {...props}
    />
  )
}
