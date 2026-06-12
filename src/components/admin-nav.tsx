'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Building2, CalendarDays, UsersRound } from 'lucide-react'

const items = [
  { href: '/organizator', label: 'Prezentare generală', shortLabel: 'Prezentare', icon: LayoutDashboard, exact: true },
  { href: '/organizator/cluburi', label: 'Cluburi', icon: Building2 },
  { href: '/organizator/evenimente', label: 'Evenimente', icon: CalendarDays },
  { href: '/organizator/utilizatori', label: 'Utilizatori', icon: UsersRound },
]

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname.startsWith(href)
}

/** Sidebar desktop (≥md). */
export function AdminSidebarNav() {
  const pathname = usePathname()
  return (
    <>
      {items.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(pathname, href, exact)
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition mb-0.5 ${
              active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Icon className="w-4 h-4" aria-hidden />
            {label}
          </Link>
        )
      })}
    </>
  )
}

/** Taburi orizontale scrollabile sub header, doar pe mobil (<md). */
export function AdminMobileNav() {
  const pathname = usePathname()
  return (
    <nav className="md:hidden print:hidden bg-white border-b border-slate-200 px-2 flex overflow-x-auto">
      {items.map(({ href, label, shortLabel, icon: Icon, exact }) => {
        const active = isActive(pathname, href, exact)
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition ${
              active ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500'
            }`}
          >
            <Icon className="w-4 h-4" aria-hidden />
            {shortLabel ?? label}
          </Link>
        )
      })}
    </nav>
  )
}
