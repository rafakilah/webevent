'use client'

import { useSyncExternalStore } from 'react'
import { AlarmClock, AlertTriangle } from 'lucide-react'
import { formatDateTime } from '@/lib/format'

function subscribe(onTick: () => void) {
  const id = setInterval(onTick, 30_000)
  return () => clearInterval(id)
}
const getNowInMinutes = () => Math.floor(Date.now() / 60_000)
const getServerSnapshot = () => null

/** Batas waktu transfer + sisa waktu. Sisa waktu dihitung di browser. */
export function Deadline({ deadline }: { deadline: string }) {
  const nowMinutes = useSyncExternalStore(subscribe, getNowInMinutes, getServerSnapshot)
  const deadlineMinutes = Math.floor(new Date(deadline).getTime() / 60_000)
  const remaining = nowMinutes === null ? null : deadlineMinutes - nowMinutes
  const overdue = remaining !== null && remaining <= 0

  if (overdue) {
    return (
      <div className="flex gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
        <AlertTriangle className="size-5 shrink-0" aria-hidden />
        <p>
          Batas transfer ({formatDateTime(deadline)} WIB) sudah lewat. Kalau kamu sudah transfer,
          tetap unggah buktinya. Kalau belum, hubungi narahubung panitia dulu.
        </p>
      </div>
    )
  }

  return (
    <p className="flex items-center gap-2 text-sm text-slate-600">
      <AlarmClock className="size-4 shrink-0 text-brand-600" aria-hidden />
      <span>
        Batas transfer <strong className="text-slate-900">{formatDateTime(deadline)} WIB</strong>
        {remaining !== null && (
          <>
            {' '}
            (sisa {Math.floor(remaining / 60)} jam {remaining % 60} menit)
          </>
        )}
      </span>
    </p>
  )
}
