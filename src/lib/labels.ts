import type { StrokeType, GenderType, UserRole } from '@/lib/supabase/types'

export const STROKE_LABELS: Record<StrokeType, string> = {
  crawl: 'Crawl',
  spate: 'Spate',
  bras: 'Bras',
  crawl_pluta: 'Crawl cu plută',
  crawl_ajutatoare: 'Crawl cu ajutătoare',
}

export const STROKES = Object.keys(STROKE_LABELS) as StrokeType[]

export const GENDER_LABELS: Record<GenderType, string> = {
  M: 'Băieți',
  F: 'Fete',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  organizator: 'Organizator',
  antrenor: 'Antrenor',
  cronometror: 'Cronometror',
  staff: 'Staff margine',
  parinte: 'Părinte',
}
