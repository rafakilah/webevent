'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { cn } from '@/lib/cn'

type Status = 'connecting' | 'live' | 'offline'

/**
 * Dashboard realtime: dengarkan perubahan tabel participants & checkins lewat
 * Supabase Realtime, lalu minta server merender ulang data (router.refresh).
 *
 * Kenapa refresh, bukan menyunting state di browser satu per satu? Sumber data
 * tetap satu (query server yang sama), jadi angka statistik dan tabel tidak
 * mungkin berbeda. Beberapa event berdekatan (misal antrean scan di pintu)
 * digabung dengan debounce supaya tidak membanjiri server.
 *
 * Realtime menghormati RLS: hanya user admin yang menerima event.
 */
export function RealtimeIndicator() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('connecting')

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    let timer: ReturnType<typeof setTimeout> | undefined
    const scheduleRefresh = () => {
      clearTimeout(timer)
      timer = setTimeout(() => router.refresh(), 500)
    }

    const channel = supabase
      .channel('admin-dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants' },
        scheduleRefresh,
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins' }, scheduleRefresh)
      .subscribe((state) => {
        if (state === 'SUBSCRIBED') {
          setStatus('live')
          // Mungkin ada perubahan selama koneksi terputus: ambil ulang sekali.
          scheduleRefresh()
        } else if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT' || state === 'CLOSED') {
          setStatus('offline')
        }
      })

    return () => {
      clearTimeout(timer)
      void supabase.removeChannel(channel)
    }
  }, [router])

  const label = { connecting: 'Menghubungkan...', live: 'Live', offline: 'Realtime terputus' }[
    status
  ]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        status === 'live' && 'bg-green-50 text-green-700',
        status === 'connecting' && 'bg-slate-100 text-slate-600',
        status === 'offline' && 'bg-amber-50 text-amber-800',
      )}
      title="Angka dan tabel diperbarui otomatis saat ada perubahan"
    >
      <span
        className={cn(
          'size-2 rounded-full',
          status === 'live' && 'animate-pulse bg-green-500',
          status === 'connecting' && 'bg-slate-400',
          status === 'offline' && 'bg-amber-500',
        )}
        aria-hidden
      />
      {label}
    </span>
  )
}
