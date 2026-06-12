import Link from 'next/link'
import { Waves } from 'lucide-react'

/** Logo + wordmark. `tone="dark"` pe fundaluri închise (auth, marketing, header admin). */
export function Logo({ href = '/', tone = 'light' }: { href?: string; tone?: 'light' | 'dark' }) {
  return (
    <Link href={href} className="flex items-center gap-2">
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${tone === 'dark' ? 'bg-brand-500' : 'bg-brand-600'}`}>
        <Waves className="w-4.5 h-4.5 text-white" strokeWidth={2.25} aria-hidden />
      </span>
      <span className={`font-bold tracking-tight ${tone === 'dark' ? 'text-white' : 'text-slate-900'}`}>
        SwimOrganizer
      </span>
    </Link>
  )
}
