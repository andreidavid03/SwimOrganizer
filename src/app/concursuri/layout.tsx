import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { AppHeaderNav, AppTabBar } from '@/components/app-nav'

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
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 h-14 flex items-center justify-between sticky top-0 z-10 print:hidden">
        <div className="flex items-center gap-6">
          <Logo href="/concursuri" />
          <AppHeaderNav />
        </div>
        <div className="flex items-center gap-3">
          {profile?.is_admin && (
            <Link
              href="/organizator"
              className="text-xs font-medium text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition"
            >
              Panou admin
            </Link>
          )}
          <form action="/auth/logout" method="post">
            <button
              title="Ieșire din cont"
              className="w-10 h-10 bg-slate-200 hover:bg-slate-300 rounded-full text-slate-700 text-xs font-semibold transition flex items-center justify-center"
            >
              {initials}
            </button>
          </form>
        </div>
      </header>

      {/* pb-24 pe mobil face loc pentru AppTabBar (bara fixă de jos) */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 pb-24 sm:pb-8">
        {children}
      </main>

      <AppTabBar />
    </div>
  )
}
