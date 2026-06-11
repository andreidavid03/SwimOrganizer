import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-xl">
        <div className="inline-flex items-center gap-2 mb-10">
          <div className="w-9 h-9 bg-blue-500 rounded-xl" />
          <span className="text-white font-bold text-xl tracking-tight">SwimOrganizer</span>
        </div>

        <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
          Concursuri de înot,<br />
          <span className="text-blue-400">organizate simplu.</span>
        </h1>
        <p className="text-slate-400 text-lg mb-10 max-w-md mx-auto">
          Înscrieri, serii automate, cronometraj live și rezultate — tot într-un singur loc.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/auth/login"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-xl transition"
          >
            Autentificare
          </Link>
          <Link
            href="/auth/register"
            className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-8 py-3 rounded-xl border border-slate-700 transition"
          >
            Cont nou
          </Link>
        </div>
      </div>

      <div className="absolute bottom-8 text-slate-600 text-sm">
        Platformă pentru cluburi de înot din România
      </div>
    </main>
  )
}
