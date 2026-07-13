'use client'

/* eslint-disable @typescript-eslint/no-explicit-any -- interogări Supabase încă netipizate */
/* eslint-disable react-hooks/set-state-in-effect -- reset controlat al culoarelor la schimbarea seriei */
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
import { Play, Square, RotateCcw, CheckCircle, Clock } from 'lucide-react'
import { formatInterval, intervalToMs } from '@/lib/time'

type Lane = {
  id: string
  lane_number: number
  seed_time: string | null
  result_time: string | null
  dns: boolean
  dq: boolean
  swimmer_id: string | null
  swimmers: { full_name: string; birth_year: number } | null
}

type Heat = {
  id: string
  heat_number: number
  status: string
  heat_lanes: Lane[]
}

/** Milisecunde cronometrate → afișare cronometru „MM:SS.cc”. */
function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  const centisec = Math.floor((ms % 1000) / 10)
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(centisec).padStart(2, '0')}`
}

/** Milisecunde → interval Postgres „HH:MM:SS.ffffff” pentru salvare. */
function msToInterval(ms: number): string {
  const totalSec = ms / 1000
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${s.toFixed(6).padStart(9, '0')}`
}

export default function CronometrorClient({ heats: initialHeats }: { heats: Heat[] }) {
  const supabase = createClient() as any

  const [heats, setHeats] = useState<Heat[]>(initialHeats)
  const [activeHeatIdx, setActiveHeatIdx] = useState(0)
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [laneResults, setLaneResults] = useState<Record<string, number | null>>({}) // laneId → ms
  const [laneDns, setLaneDns] = useState<Record<string, boolean>>({})
  const [laneDq, setLaneDq] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const activeHeat = heats[activeHeatIdx]

  // Reîncarcă starea culoarelor la schimbarea seriei
  useEffect(() => {
    if (!activeHeat) return
    const results: Record<string, number | null> = {}
    const dns: Record<string, boolean> = {}
    const dq: Record<string, boolean> = {}
    activeHeat.heat_lanes.forEach(lane => {
      results[lane.id] = intervalToMs(lane.result_time)
      dns[lane.id] = lane.dns
      dq[lane.id] = lane.dq
    })
    setLaneResults(results)
    setLaneDns(dns)
    setLaneDq(dq)
    setElapsed(0)
    setRunning(false)
    setSaved(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [activeHeatIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  function startTimer() {
    const origin = Date.now() - elapsed
    setRunning(true)
    timerRef.current = setInterval(() => setElapsed(Date.now() - origin), 10)
  }

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    setRunning(false)
  }

  function resetTimer() {
    stopTimer()
    setElapsed(0)
  }

  function recordLane(laneId: string) {
    if (!running) return
    setLaneResults(prev => ({
      ...prev,
      [laneId]: prev[laneId] != null ? prev[laneId] : elapsed,
    }))
  }

  function clearLane(laneId: string) {
    setLaneResults(prev => ({ ...prev, [laneId]: null }))
  }

  function toggleDns(laneId: string) {
    setLaneDns(prev => ({ ...prev, [laneId]: !prev[laneId] }))
    if (!laneDns[laneId]) setLaneResults(prev => ({ ...prev, [laneId]: null }))
  }

  function toggleDq(laneId: string) {
    setLaneDq(prev => ({ ...prev, [laneId]: !prev[laneId] }))
  }

  async function saveResults() {
    if (!activeHeat) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()

    for (const lane of activeHeat.heat_lanes) {
      const ms = laneResults[lane.id]
      await supabase.from('heat_lanes').update({
        result_time: ms != null ? msToInterval(ms) : null,
        dns: laneDns[lane.id] ?? false,
        dq: laneDq[lane.id] ?? false,
        recorded_by: user?.id,
        recorded_at: new Date().toISOString(),
      }).eq('id', lane.id)
    }

    await supabase.from('heats').update({ status: 'completed' }).eq('id', activeHeat.id)
    setHeats(prev => prev.map((h, idx) => idx === activeHeatIdx ? { ...h, status: 'completed' } : h))

    setSaving(false)
    setSaved(true)
  }

  const lanes = activeHeat?.heat_lanes.slice().sort((a, b) => a.lane_number - b.lane_number) ?? []
  const allRecorded = lanes.filter(l => l.swimmer_id).every(l =>
    laneResults[l.id] != null || laneDns[l.id] || laneDq[l.id]
  )

  if (heats.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400">
        <Clock className="w-12 h-12 mx-auto mb-4 opacity-30" aria-hidden />
        <p className="text-lg">Nicio serie generată pentru această probă.</p>
        <p className="text-sm mt-2">Mergi la Serii & Cronometraj și generează seriile mai întâi.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Selector serii */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {heats.map((heat, idx) => (
          <button
            key={heat.id}
            onClick={() => { if (!running) setActiveHeatIdx(idx) }}
            className={`inline-flex items-center gap-1.5 px-4 h-11 rounded-xl text-sm font-medium transition border ${
              idx === activeHeatIdx
                ? 'bg-brand-600 border-brand-500 text-white'
                : heat.status === 'completed'
                  ? 'bg-green-900/30 border-green-700 text-green-400'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
            }`}
          >
            {heat.status === 'completed' && <CheckCircle className="w-4 h-4" aria-hidden />}
            Seria {heat.heat_number}
          </button>
        ))}
      </div>

      {/* Cronometru mare */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mb-6 text-center">
        <div className="font-mono text-6xl font-bold tabular-nums mb-6 text-white">
          {formatMs(elapsed)}
        </div>
        <div className="flex justify-center gap-3">
          {!running ? (
            <Button onClick={startTimer} size="lg" className="bg-green-600 hover:bg-green-500 text-white px-8">
              <Play className="w-5 h-5" aria-hidden /> START
            </Button>
          ) : (
            <Button onClick={stopTimer} size="lg" className="bg-red-600 hover:bg-red-500 text-white px-8">
              <Square className="w-5 h-5" aria-hidden /> STOP
            </Button>
          )}
          <Button onClick={resetTimer} size="lg" variant="ghost" className="text-slate-400 hover:text-white">
            <RotateCcw className="w-5 h-5" aria-hidden />
          </Button>
        </div>
        {running && (
          <p className="text-slate-400 text-sm mt-4">Apasă pe culoar pentru a înregistra timpul</p>
        )}
      </div>

      {/* Culoare */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {lanes.map(lane => {
          const hasResult = laneResults[lane.id] != null
          const isDns = laneDns[lane.id]
          const isDq = laneDq[lane.id]
          const isEmpty = !lane.swimmer_id

          return (
            <div
              key={lane.id}
              className={`rounded-2xl border p-4 transition ${
                isEmpty
                  ? 'border-slate-800 bg-slate-900/50 opacity-40'
                  : hasResult
                    ? 'border-green-600 bg-green-900/20 cursor-default'
                    : isDns
                      ? 'border-red-800 bg-red-900/20'
                      : isDq
                        ? 'border-orange-800 bg-orange-900/20'
                        : running
                          ? 'border-slate-600 bg-slate-800 cursor-pointer hover:border-brand-500 hover:bg-brand-900/30 active:scale-95'
                          : 'border-slate-700 bg-slate-800'
              }`}
              onClick={() => !isEmpty && !isDns && !isDq && !hasResult && recordLane(lane.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400">C{lane.lane_number}</span>
                {!isEmpty && hasResult && (
                  <button onClick={e => { e.stopPropagation(); clearLane(lane.id) }}
                    className="text-xs text-slate-500 hover:text-red-400">✕</button>
                )}
              </div>

              {isEmpty ? (
                <p className="text-slate-600 text-sm text-center mt-2">—</p>
              ) : (
                <>
                  <p className="font-semibold text-white text-sm truncate">{lane.swimmers?.full_name}</p>
                  <p className="text-slate-400 text-xs mb-3">{lane.swimmers?.birth_year}</p>
                  <p className="text-slate-500 text-xs mb-2">Ref: {formatInterval(lane.seed_time)}</p>

                  {isDns ? (
                    <div className="text-red-400 font-bold text-center text-sm">DNS</div>
                  ) : isDq ? (
                    <div className="text-orange-400 font-bold text-center text-sm">DQ</div>
                  ) : hasResult ? (
                    <div className="text-green-400 font-bold text-center text-lg font-mono">
                      {formatMs(laneResults[lane.id]!)}
                    </div>
                  ) : (
                    <div className="text-slate-500 text-center text-sm font-mono">
                      {running ? '▶ apasă' : '—'}
                    </div>
                  )}

                  {/* DNS / DQ */}
                  <div className="flex gap-1 mt-3">
                    <button
                      onClick={e => { e.stopPropagation(); toggleDns(lane.id) }}
                      className={`flex-1 text-xs rounded-lg py-1.5 border transition ${
                        isDns ? 'bg-red-700 border-red-600 text-white' : 'border-slate-700 text-slate-500 hover:border-red-700 hover:text-red-400'
                      }`}
                    >DNS</button>
                    <button
                      onClick={e => { e.stopPropagation(); toggleDq(lane.id) }}
                      className={`flex-1 text-xs rounded-lg py-1.5 border transition ${
                        isDq ? 'bg-orange-700 border-orange-600 text-white' : 'border-slate-700 text-slate-500 hover:border-orange-700 hover:text-orange-400'
                      }`}
                    >DQ</button>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Salvare */}
      <div className="flex items-center justify-between gap-3 bg-slate-900 rounded-2xl border border-slate-800 p-4">
        <div className="text-sm text-slate-400">
          {allRecorded
            ? <span className="text-green-400">Toate culoarele au timp înregistrat</span>
            : <span>Înregistrează timpii pentru toți înotătorii</span>
          }
        </div>
        <Button
          onClick={saveResults}
          disabled={saving || saved || running}
          variant={saved ? 'secondary' : 'primary'}
          className={saved ? 'bg-green-700 text-white' : ''}
        >
          {saving ? 'Salvare...' : saved ? <><CheckCircle className="w-4 h-4" aria-hidden /> Salvat</> : 'Salvează seria'}
        </Button>
      </div>

      {saved && activeHeatIdx < heats.length - 1 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => { setActiveHeatIdx(i => i + 1); setSaved(false) }}
            className="text-brand-400 hover:text-brand-300 text-sm underline"
          >
            Continuă cu Seria {heats[activeHeatIdx + 1]?.heat_number} →
          </button>
        </div>
      )}
    </div>
  )
}
