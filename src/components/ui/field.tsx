import type { ComponentProps, ReactNode } from 'react'

/*
 * Câmpuri de formular. `tone="light"` pe fundal alb (aplicație),
 * `tone="dark"` pe fundal slate-950 (pagini auth / marketing).
 * h-12 + text-base: țintă de atingere de 48px și fără zoom automat pe iOS.
 */
export type FieldTone = 'light' | 'dark'

const inputBase =
  'w-full h-12 rounded-xl px-4 text-base transition outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent'

const inputTones: Record<FieldTone, string> = {
  light: 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400',
  dark: 'bg-slate-800 border border-slate-700 text-white placeholder-slate-500',
}

const labelTones: Record<FieldTone, string> = {
  light: 'text-slate-700',
  dark: 'text-slate-300',
}

type ToneProp = { tone?: FieldTone }

export function Label({ tone = 'light', className = '', ...props }: ComponentProps<'label'> & ToneProp) {
  return <label className={`block text-sm font-medium mb-2 ${labelTones[tone]} ${className}`} {...props} />
}

export function Input({ tone = 'light', className = '', ...props }: ComponentProps<'input'> & ToneProp) {
  return <input className={`${inputBase} ${inputTones[tone]} ${className}`} {...props} />
}

export function Select({ tone = 'light', className = '', ...props }: ComponentProps<'select'> & ToneProp) {
  return <select className={`${inputBase} ${inputTones[tone]} ${className}`} {...props} />
}

export function Textarea({ tone = 'light', className = '', ...props }: ComponentProps<'textarea'> & ToneProp) {
  return (
    <textarea
      className={`w-full rounded-xl px-4 py-3 text-base transition outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent min-h-28 ${inputTones[tone]} ${className}`}
      {...props}
    />
  )
}

export function FormError({ tone = 'light', children }: ToneProp & { children: ReactNode }) {
  if (!children) return null
  const tones: Record<FieldTone, string> = {
    light: 'bg-red-50 border-red-200 text-red-700',
    dark: 'bg-red-500/10 border-red-500/20 text-red-400',
  }
  return <div className={`border text-sm px-4 py-3 rounded-xl ${tones[tone]}`}>{children}</div>
}
