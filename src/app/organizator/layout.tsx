import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/logo'
import { AdminSidebarNav, AdminMobileNav } from '@/components/admin-nav'

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
      <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center justify-between sticky top-0 z-10 print:hidden">
        <div className="flex items-center gap-6">
          <Logo href="/organizator" tone="dark" />
          <span className="text-slate-500 text-sm hidden sm:block">Panou administrare</span>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/concursuri"
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition px-3 py-2 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            <span className="hidden sm:inline">Aplicație</span>
          </Link>
          <form action="/auth/logout" method="post">
            <button className="text-slate-400 hover:text-white text-sm transition px-3 py-2 rounded-lg">
              Ieșire
            </button>
          </form>
        </div>
      </header>

      <AdminMobileNav />

      <div className="flex flex-1">
        <nav className="w-56 bg-white border-r border-slate-200 py-6 px-3 hidden md:flex flex-col shrink-0 print:hidden">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Gestionare
          </p>
          <AdminSidebarNav />
        </nav>

        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
