'use client'

import { useEffect, useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, PaymentStatus } from '@/types/database'
import { formatTime } from '@/lib/format'
import { StatusBadge } from '@/components/status/status-badge'
import { buttonClass } from '@/components/ui/button'

type Row = {
  id: string
  full_name: string
  nim: string
  major: string
  payment_status: PaymentStatus
  checked_in_at: string | null
}

/** Buang karakter yang punya arti khusus di filter PostgREST. */
function sanitize(query: string) {
  return query
    .replace(/[^\p{L}\p{N} '-]/gu, '')
    .trim()
    .slice(0, 50)
}

/**
 * Check-in manual untuk peserta yang HP-nya mati atau QR-nya rusak.
 * Cari nama/NIM, lalu tekan tombol check-in. Memakai fungsi check_in yang sama
 * dengan scanner, jadi aturan (harus lunas, tidak boleh dobel) tetap berlaku.
 */
export function ManualCheckin({
  supabase,
  onCheckIn,
  refreshKey,
}: {
  supabase: SupabaseClient<Database>
  onCheckIn: (participantId: string) => void
  refreshKey: number
}) {
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const clean = sanitize(query)

  useEffect(() => {
    if (clean.length < 2) return
    let cancelled = false
    // Debounce: tunggu 300 ms setelah berhenti mengetik sebelum query.
    const timer = setTimeout(async () => {
      setLoading(true)
      const { data, error: queryError } = await supabase
        .from('participants')
        .select('id, full_name, nim, major, payment_status, checkins(checked_in_at)')
        .or(`full_name.ilike."%${clean}%",nim.ilike."%${clean}%"`)
        .order('full_name')
        .limit(10)
      if (cancelled) return
      setLoading(false)
      if (queryError) {
        setError('Gagal mencari. Cek koneksi.')
        return
      }
      setError(null)
      setRows(
        data.map(({ checkins, ...row }) => ({
          ...row,
          checked_in_at: checkins?.checked_in_at ?? null,
        })),
      )
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [clean, supabase, refreshKey])

  const visibleRows = clean.length < 2 ? [] : rows

  return (
    <div className="space-y-3">
      <label className="relative block">
        <span className="sr-only">Cari nama atau NIM</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ketik nama atau NIM"
          autoComplete="off"
          className="h-14 w-full rounded-2xl border border-slate-300 bg-white pr-10 pl-12 text-lg outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
        />
        {loading && (
          <Loader2
            className="absolute top-1/2 right-4 size-5 -translate-y-1/2 animate-spin text-slate-400"
            aria-label="Mencari"
          />
        )}
      </label>

      {error && <p className="text-sm text-red-700">{error}</p>}
      {clean.length >= 2 && !loading && visibleRows.length === 0 && !error && (
        <p className="p-4 text-center text-slate-500">Tidak ada peserta dengan nama/NIM itu.</p>
      )}

      <ul className="space-y-2">
        {visibleRows.map((row) => (
          <li
            key={row.id}
            className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{row.full_name}</p>
              <p className="text-sm text-slate-500">
                {row.nim} · {row.major}
              </p>
              <div className="mt-1">
                {row.checked_in_at ? (
                  <span className="text-sm font-medium text-green-700">
                    ✓ Check-in {formatTime(row.checked_in_at)}
                  </span>
                ) : (
                  <StatusBadge status={row.payment_status} />
                )}
              </div>
            </div>
            {!row.checked_in_at && row.payment_status === 'lunas' && (
              <button
                type="button"
                onClick={() => onCheckIn(row.id)}
                className={buttonClass('primary', 'md')}
              >
                Check-in
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
