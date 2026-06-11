import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('full_name, is_admin')
    .eq('id', user.id)
    .single()

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '??'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 h-14 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <Link href="/concursuri" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg" />
            <span className="font-bold text-slate-900 tracking-tight">SwimOrganizer</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            <NavLink href="/concursuri">Concursuri</NavLink>
            <NavLink href="/concursuri/inscrierile-mele">Înscrierile mele</NavLink>
            <NavLink href="/concursuri/sportivii-mei">Sportivi</NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {profile?.is_admin && (
            <Link
              href="/organizator"
              className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
            >
              Panou admin
            </Link>
          )}
          <form action="/auth/logout" method="post">
            <button className="w-8 h-8 bg-slate-200 hover:bg-slate-300 rounded-full text-slate-700 text-xs font-semibold transition flex items-center justify-center">
              {initials}
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition font-medium"
    >
      {children}
    </Link>
  )
}
