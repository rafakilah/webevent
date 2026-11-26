'use client'

import { useSyncExternalStore } from 'react'

/*
 * Waktu "sekarang" hanya dibaca di browser. Di server (saat prerender) nilainya
 * null, jadi HTML statis menampilkan placeholder dan tidak terjadi hydration
 * mismatch karena jam server dan jam HP berbeda.
 */
function subscribe(onTick: () => void) {
  const id = setInterval(onTick, 1000)
  return () => clearInterval(id)
}
const getNowInSeconds = () => Math.floor(Date.now() / 1000)
const getServerSnapshot = () => null

const UNITS = [
  { label: 'Hari', seconds: 86_400 },
  { label: 'Jam', seconds: 3_600 },
  { label: 'Menit', seconds: 60 },
  { label: 'Detik', seconds: 1 },
] as const

/** 93784 detik -> [01, 02, 03, 04] (hari, jam, menit, detik). */
function splitDuration(totalSeconds: number | null) {
  return UNITS.map((unit, index) => {
    if (totalSeconds === null) return { label: unit.label, value: '--' }
    const larger = index === 0 ? Infinity : UNITS[index - 1].seconds
    const value = Math.floor((totalSeconds % larger) / unit.seconds)
    return { label: unit.label, value: String(value).padStart(2, '0') }
  })
}

export function Countdown({ target, endsAt }: { target: string; endsAt: string }) {
  const now = useSyncExternalStore(subscribe, getNowInSeconds, getServerSnapshot)
  const targetSeconds = Math.floor(new Date(target).getTime() / 1000)
  const endSeconds = Math.floor(new Date(endsAt).getTime() / 1000)

  if (now !== null && now >= targetSeconds) {
    return (
      <p className="text-center text-lg font-semibold">
        {now < endSeconds ? 'Acara sedang berlangsung 🎉' : 'Acara telah selesai. Terima kasih!'}
      </p>
    )
  }

  const parts = splitDuration(now === null ? null : targetSeconds - now)

  return (
    <div role="timer" aria-label="Hitung mundur menuju acara" className="grid grid-cols-4 gap-2">
      {parts.map((part) => (
        <div key={part.label} className="rounded-xl bg-white/10 px-1 py-3 text-center">
          <div className="font-mono text-2xl font-bold tabular-nums sm:text-3xl">{part.value}</div>
          <div className="mt-1 text-xs text-brand-100">{part.label}</div>
        </div>
      ))}
    </div>
  )
}
