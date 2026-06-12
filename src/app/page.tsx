import Link from 'next/link'
import { Waves } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-xl">
        <div className="inline-flex items-center gap-2 mb-10">
          <span className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
            <Waves className="w-5 h-5 text-white" strokeWidth={2.25} aria-hidden />
          </span>
          <span className="text-white font-bold text-xl tracking-tight">SwimOrganizer</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
          Concursuri de înot,<br />
          <span className="text-brand-400">organizate simplu.</span>
        </h1>
        <p className="text-slate-400 text-lg mb-10 max-w-md mx-auto">
          Înscrieri, serii automate, cronometraj live și rezultate — tot într-un singur loc.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center h-12 bg-brand-600 hover:bg-brand-500 text-white font-semibold px-8 rounded-xl transition"
          >
            Autentificare
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center h-12 bg-slate-800 hover:bg-slate-700 text-white font-semibold px-8 rounded-xl border border-slate-700 transition"
          >
            Cont nou
          </Link>
        </div>
      </div>

      <div className="absolute bottom-8 text-slate-600 text-sm px-4 text-center">
        Platformă pentru cluburi de înot din România
      </div>
    </main>
  )
}
