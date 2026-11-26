'use client'

import { useCallback, useRef, useState, useSyncExternalStore } from 'react'
import { Keyboard, QrCode, Wifi, WifiOff } from 'lucide-react'
import { isTicketToken, performCheckIn, type CheckInOutcome } from '@/lib/checkin'
import { feedback, unlockAudio, type FeedbackKind } from '@/lib/feedback'
import { formatTime } from '@/lib/format'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { cn } from '@/lib/cn'
import { ManualCheckin } from './manual-checkin'
import { QrCamera } from './qr-camera'
import { ResultCard, type ScanResult } from './result-card'

const SAME_CODE_COOLDOWN_MS = 4000

const FEEDBACK: Record<CheckInOutcome['kind'], FeedbackKind> = {
  berhasil: 'success',
  sudah: 'warning',
  belum_lunas: 'error',
  tidak_valid: 'error',
  bukan_tiket: 'error',
  gagal_jaringan: 'error',
}

type HistoryItem = { id: number; outcome: CheckInOutcome; at: number }

function subscribeOnline(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

export function ScanStation() {
  const [supabase] = useState(() => createSupabaseBrowserClient())
  const [mode, setMode] = useState<'scan' | 'manual'>('scan')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [manualRefresh, setManualRefresh] = useState(0)
  const online = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  )

  // Kamera membaca QR beberapa kali per detik. Ref ini mencegah QR yang sama
  // diproses berulang dan mencegah dua request berjalan bersamaan.
  const busyRef = useRef(false)
  const lastCodeRef = useRef<{ code: string; at: number } | null>(null)

  const showOutcome = useCallback((outcome: CheckInOutcome) => {
    const at = Date.now()
    setResult({ state: 'done', outcome, scannedAt: at })
    setHistory((prev) => [{ id: at, outcome, at }, ...prev].slice(0, 8))
    feedback(FEEDBACK[outcome.kind])
  }, [])

  const handleScan = useCallback(
    async (text: string) => {
      const code = text.trim()
      const now = Date.now()
      const last = lastCodeRef.current
      if (busyRef.current) return
      if (last && last.code === code && now - last.at < SAME_CODE_COOLDOWN_MS) return
      lastCodeRef.current = { code, at: now }

      if (!isTicketToken(code)) {
        showOutcome({ kind: 'bukan_tiket' })
        return
      }

      busyRef.current = true
      setResult({ state: 'pending', label: 'Memeriksa tiket...' })
      try {
        showOutcome(await performCheckIn(supabase, { token: code }))
      } finally {
        busyRef.current = false
        lastCodeRef.current = { code, at: Date.now() }
      }
    },
    [supabase, showOutcome],
  )

  const handleManual = useCallback(
    async (participantId: string) => {
      if (busyRef.current) return
      unlockAudio()
      busyRef.current = true
      setResult({ state: 'pending', label: 'Mencatat check-in...' })
      try {
        showOutcome(await performCheckIn(supabase, { participantId }))
        setManualRefresh((n) => n + 1)
      } finally {
        busyRef.current = false
      }
    },
    [supabase, showOutcome],
  )

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Check-in peserta</h1>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
            online ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700',
          )}
        >
          {online ? (
            <Wifi className="size-3.5" aria-hidden />
          ) : (
            <WifiOff className="size-3.5" aria-hidden />
          )}
          {online ? 'Online' : 'Offline'}
        </span>
      </div>

      <div role="tablist" className="grid grid-cols-2 gap-1 rounded-xl bg-slate-200 p-1">
        {(
          [
            ['scan', 'Scan QR', QrCode],
            ['manual', 'Manual', Keyboard],
          ] as const
        ).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => setMode(value)}
            className={cn(
              'inline-flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold',
              mode === value ? 'bg-white shadow-sm' : 'text-slate-600',
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {/* Kamera tetap terpasang saat pindah tab supaya tidak perlu izin ulang. */}
      <div hidden={mode !== 'scan'}>
        <QrCamera onScan={handleScan} onStart={unlockAudio} active={mode === 'scan'} />
      </div>

      <ResultCard result={result} />

      {mode === 'manual' && (
        <ManualCheckin supabase={supabase} onCheckIn={handleManual} refreshKey={manualRefresh} />
      )}

      {history.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-600">Riwayat scan perangkat ini</h2>
          <ul className="divide-y divide-slate-100 rounded-2xl bg-white text-sm ring-1 ring-slate-200">
            {history.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="truncate">
                  {'fullName' in item.outcome && item.outcome.fullName
                    ? item.outcome.fullName
                    : 'QR tidak dikenal'}
                </span>
                <span className="flex shrink-0 items-center gap-2 text-xs text-slate-500">
                  <HistoryDot kind={item.outcome.kind} />
                  {formatTime(new Date(item.at))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function HistoryDot({ kind }: { kind: CheckInOutcome['kind'] }) {
  const color =
    kind === 'berhasil' ? 'bg-green-500' : kind === 'sudah' ? 'bg-amber-400' : 'bg-red-500'
  const label =
    kind === 'berhasil'
      ? 'berhasil'
      : kind === 'sudah'
        ? 'sudah'
        : kind === 'gagal_jaringan'
          ? 'gagal'
          : 'ditolak'
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn('size-2 rounded-full', color)} aria-hidden />
      {label}
    </span>
  )
}
