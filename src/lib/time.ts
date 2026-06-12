// Utilitare pentru coloanele INTERVAL din Postgres (seed_time / result_time).
// Postgres returnează intervalele ca "HH:MM:SS.ff"; utilizatorii scriu "1:23.45".

/** Interval Postgres → milisecunde. null dacă valoarea nu poate fi interpretată. */
export function intervalToMs(value: string | null | undefined): number | null {
  if (!value) return null
  const m = value.match(/^(?:(\d+):)?(\d{1,2}):(\d{1,2})(?:[.,](\d{1,3}))?$/)
  if (!m) return null
  const [, h = '0', min, s, frac = '0'] = m
  const fracMs = Math.round(Number(`0.${frac}`) * 1000)
  return ((Number(h) * 60 + Number(min)) * 60 + Number(s)) * 1000 + fracMs
}

/** Interval Postgres → afișare scurtă: "1:23.45" sau "45.20". */
export function formatInterval(value: string | null | undefined): string {
  const ms = intervalToMs(value)
  if (ms === null) return '—'
  const totalCs = Math.round(ms / 10)
  const cs = totalCs % 100
  const totalS = Math.floor(totalCs / 100)
  const s = totalS % 60
  const min = Math.floor(totalS / 60)
  const csStr = String(cs).padStart(2, '0')
  return min > 0 ? `${min}:${String(s).padStart(2, '0')}.${csStr}` : `${s}.${csStr}`
}

/**
 * Input utilizator → interval Postgres "00:MM:SS.cc", sau null dacă e invalid.
 * Acceptă "1:23.45", "1:23", "83.4" (secundele peste 60 sunt convertite), virgulă sau punct.
 */
export function parseTimeInput(input: string): string | null {
  const t = input.trim().replace(',', '.')
  if (!t) return null
  const m = t.match(/^(?:(\d{1,2}):)?(\d{1,3})(?:\.(\d{1,2}))?$/)
  if (!m) return null
  const [, minStr, sStr, fracStr = ''] = m
  let min = minStr ? parseInt(minStr, 10) : 0
  let s = parseInt(sStr, 10)
  if (!minStr && s >= 60) {
    min = Math.floor(s / 60)
    s = s % 60
  }
  if (s >= 60 || min >= 60) return null
  const frac = fracStr.padEnd(2, '0')
  return `00:${String(min).padStart(2, '0')}:${String(s).padStart(2, '0')}.${frac}`
}
