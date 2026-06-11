import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function OrganizatorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('full_name, is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/concursuri')

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/organizator" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-500 rounded-lg" />
            <span className="font-bold text-white tracking-tight">SwimOrganizer</span>
          </Link>
          <span className="text-slate-500 text-sm hidden sm:block">Panou administrare</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/concursuri" className="text-slate-400 hover:text-white text-sm transition">
            ← Aplicație
          </Link>
          <form action="/auth/logout" method="post">
            <button className="text-slate-400 hover:text-white text-sm transition">Ieșire</button>
          </form>
        </div>
      </header>

      <div className="flex flex-1">
        <nav className="w-52 bg-white border-r border-slate-200 py-6 px-3 hidden md:flex flex-col shrink-0">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Gestionare
          </p>
          <NavLink href="/organizator">Prezentare generală</NavLink>
          <NavLink href="/organizator/cluburi">Cluburi</NavLink>
          <NavLink href="/organizator/evenimente">Evenimente</NavLink>
          <NavLink href="/organizator/utilizatori">Utilizatori</NavLink>
        </nav>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition mb-0.5 font-medium"
    >
      {children}
    </Link>
  )
}
