'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import { ChevronRight, Download, Search } from 'lucide-react'
import { formatDateTime, formatTime } from '@/lib/format'
import {
  DEFAULT_FILTER,
  filterParticipants,
  filterToSearchParams,
  type CheckinFilter,
  type ParticipantFilter,
  type PaymentFilter,
} from '@/lib/participant-filter'
import type { AdminParticipant, DashboardStats } from '@/types/admin'
import { STATUS_LABEL, StatusBadge } from '@/components/status/status-badge'
import { buttonClass } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { ParticipantDialog } from './participant-dialog'
import { StatsCards } from './stats-cards'

const selectClass =
  'h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100'

export function Dashboard({
  participants,
  stats,
}: {
  participants: AdminParticipant[]
  stats: DashboardStats
}) {
  const [filter, setFilter] = useState<ParticipantFilter>(DEFAULT_FILTER)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // Ketik di kolom cari tetap responsif; penyaringan menyusul sesaat kemudian.
  const deferredFilter = useDeferredValue(filter)

  const visible = useMemo(
    () => filterParticipants(participants, deferredFilter),
    [participants, deferredFilter],
  )
  const isFiltered = filterToSearchParams(filter).size > 0
  const exportFilteredHref = `/api/admin/export?${filterToSearchParams(filter)}`

  // Antrean verifikasi: yang paling lama menunggu diproses lebih dulu.
  const waitingQueue = useMemo(
    () =>
      participants
        .filter((p) => p.payment_status === 'menunggu_verifikasi')
        .sort((a, b) => (a.proof_uploaded_at ?? '').localeCompare(b.proof_uploaded_at ?? '')),
    [participants],
  )
  // Data peserta terpilih selalu diambil dari props terbaru, jadi otomatis
  // ikut berubah setelah refresh() dari Server Action.
  const selected = participants.find((p) => p.id === selectedId) ?? null
  const nextWaiting = waitingQueue.find((p) => p.id !== selectedId) ?? null

  function update<K extends keyof ParticipantFilter>(key: K, value: ParticipantFilter[K]) {
    setFilter((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-5">
      <StatsCards stats={stats} />

      {waitingQueue.length > 0 && (
        <button
          type="button"
          onClick={() => setSelectedId(waitingQueue[0].id)}
          className="flex w-full items-center justify-between gap-3 rounded-2xl bg-sky-50 p-4 text-left text-sky-900 ring-1 ring-sky-200 hover:bg-sky-100"
        >
          <span>
            <span className="font-semibold">{waitingQueue.length} bukti transfer</span> menunggu
            verifikasi. Mulai dari yang paling lama.
          </span>
          <ChevronRight className="size-5 shrink-0" aria-hidden />
        </button>
      )}

      <section className="rounded-2xl bg-white ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Cari peserta</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              type="search"
              value={filter.q}
              onChange={(e) => update('q', e.target.value)}
              placeholder="Cari nama, NIM, atau email"
              className={cn(selectClass, 'w-full pl-9')}
            />
          </label>
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <label>
              <span className="sr-only">Filter status bayar</span>
              <select
                value={filter.payment}
                onChange={(e) => update('payment', e.target.value as PaymentFilter)}
                className={cn(selectClass, 'w-full')}
              >
                <option value="semua">Semua status bayar</option>
                {Object.entries(STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">Filter check-in</span>
              <select
                value={filter.checkin}
                onChange={(e) => update('checkin', e.target.value as CheckinFilter)}
                className={cn(selectClass, 'w-full')}
              >
                <option value="semua">Semua check-in</option>
                <option value="sudah">Sudah check-in</option>
                <option value="belum">Belum check-in</option>
              </select>
            </label>
          </div>
          <div className="flex gap-2">
            {isFiltered && (
              <a
                href={exportFilteredHref}
                className={buttonClass('secondary', 'md', 'flex-1 whitespace-nowrap')}
              >
                <Download className="size-4" aria-hidden /> CSV hasil filter ({visible.length})
              </a>
            )}
            <a
              href="/api/admin/export"
              className={buttonClass('secondary', 'md', 'flex-1 whitespace-nowrap')}
            >
              <Download className="size-4" aria-hidden /> CSV semua ({participants.length})
            </a>
          </div>
        </div>

        <p className="px-4 pt-3 text-xs text-slate-500" aria-live="polite">
          Menampilkan {visible.length} dari {participants.length} peserta
          {isFiltered && (
            <>
              {' · '}
              <button
                type="button"
                className="font-medium text-brand-700 underline"
                onClick={() => setFilter(DEFAULT_FILTER)}
              >
                reset filter
              </button>
            </>
          )}
        </p>

        {visible.length === 0 ? (
          <p className="p-10 text-center text-slate-500">Tidak ada peserta yang cocok.</p>
        ) : (
          <>
            {/* HP: daftar kartu */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {visible.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    className="flex w-full items-center gap-3 p-4 text-left hover:bg-slate-50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{p.full_name}</span>
                      <span className="block text-sm text-slate-500">
                        {p.nim} · {p.major}
                      </span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-2">
                        <StatusBadge status={p.payment_status} />
                        {p.checked_in_at && (
                          <span className="text-xs font-medium text-green-700">
                            ✓ Check-in {formatTime(p.checked_in_at)}
                          </span>
                        )}
                      </span>
                    </span>
                    <ChevronRight className="size-5 text-slate-400" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>

            {/* Desktop: tabel */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-slate-500 uppercase">
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 font-medium">Peserta</th>
                    <th className="px-4 py-3 font-medium">Jurusan</th>
                    <th className="px-4 py-3 font-medium">Daftar</th>
                    <th className="px-4 py-3 font-medium">Status bayar</th>
                    <th className="px-4 py-3 font-medium">Check-in</th>
                    <th className="px-4 py-3">
                      <span className="sr-only">Aksi</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((p) => (
                    <tr
                      key={p.id}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => setSelectedId(p.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{p.full_name}</div>
                        <div className="text-slate-500 tabular-nums">{p.nim}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{p.major}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {formatDateTime(p.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={p.payment_status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {p.checked_in_at ? (
                          <span className="font-medium text-green-700">
                            ✓ {formatTime(p.checked_in_at)}
                          </span>
                        ) : (
                          <span className="text-slate-400">Belum</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedId(p.id)
                          }}
                          className="font-medium text-brand-700 hover:underline"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {selected && (
        <ParticipantDialog
          key={selected.id}
          participant={selected}
          nextWaiting={nextWaiting}
          onNext={(id) => setSelectedId(id)}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}
