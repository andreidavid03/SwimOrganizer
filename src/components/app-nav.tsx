'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ClipboardList, Users } from 'lucide-react'

const items = [
  { href: '/concursuri', label: 'Concursuri', icon: Home, exact: true },
  { href: '/concursuri/inscrierile-mele', label: 'Înscrierile mele', shortLabel: 'Înscrieri', icon: ClipboardList },
  { href: '/concursuri/sportivii-mei', label: 'Sportivi', icon: Users },
]

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname.startsWith(href)
}

/** Navigația din header — vizibilă doar pe ≥sm. Pe mobil folosim AppTabBar. */
export function AppHeaderNav() {
  const pathname = usePathname()
  return (
    <nav className="hidden sm:flex items-center gap-1">
      {items.map(({ href, label, exact }) => {
        const active = isActive(pathname, href, exact)
        return (
          <Link
            key={href}
            href={href}
            className={`text-sm px-3 py-1.5 rounded-lg transition font-medium ${
              active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

/** Bară de taburi fixă jos, doar pe mobil (<sm). Layout-ul trebuie să aibă pb-24 pe mobil. */
export function AppTabBar() {
  const pathname = usePathname()
  return (
    <nav className="sm:hidden print:hidden fixed bottom-0 inset-x-0 z-20 bg-white border-t border-slate-200 pb-safe">
      <div className="grid grid-cols-3">
        {items.map(({ href, label, shortLabel, icon: Icon, exact }) => {
          const active = isActive(pathname, href, exact)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-1 py-2 min-h-14 text-[11px] font-medium transition ${
                active ? 'text-brand-600' : 'text-slate-500'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} aria-hidden />
              {shortLabel ?? label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
