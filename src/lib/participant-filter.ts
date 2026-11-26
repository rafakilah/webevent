import type { PaymentStatus } from '@/types/database'

export type PaymentFilter = 'semua' | PaymentStatus
export type CheckinFilter = 'semua' | 'sudah' | 'belum'

export type ParticipantFilter = {
  q: string
  payment: PaymentFilter
  checkin: CheckinFilter
}

export const DEFAULT_FILTER: ParticipantFilter = { q: '', payment: 'semua', checkin: 'semua' }

const PAYMENT_VALUES: PaymentFilter[] = [
  'semua',
  'menunggu_pembayaran',
  'menunggu_verifikasi',
  'lunas',
  'ditolak',
]
const CHECKIN_VALUES: CheckinFilter[] = ['semua', 'sudah', 'belum']

type Filterable = {
  full_name: string
  nim: string
  email: string
  payment_status: PaymentStatus
  checked_in_at: string | null
}

/**
 * Logika filter yang SAMA dipakai di tabel (browser) dan export CSV (server),
 * supaya "export hasil filter" selalu berisi persis apa yang terlihat di layar.
 */
export function filterParticipants<T extends Filterable>(
  rows: T[],
  filter: ParticipantFilter,
): T[] {
  const q = filter.q.trim().toLowerCase()
  return rows.filter((row) => {
    if (filter.payment !== 'semua' && row.payment_status !== filter.payment) return false
    if (filter.checkin === 'sudah' && !row.checked_in_at) return false
    if (filter.checkin === 'belum' && row.checked_in_at) return false
    if (!q) return true
    return (
      row.full_name.toLowerCase().includes(q) ||
      row.nim.toLowerCase().includes(q) ||
      row.email.toLowerCase().includes(q)
    )
  })
}

export function filterToSearchParams(filter: ParticipantFilter): URLSearchParams {
  const params = new URLSearchParams()
  if (filter.q.trim()) params.set('q', filter.q.trim())
  if (filter.payment !== 'semua') params.set('payment', filter.payment)
  if (filter.checkin !== 'semua') params.set('checkin', filter.checkin)
  return params
}

/** Baca filter dari query string; nilai yang tidak dikenal diabaikan. */
export function filterFromSearchParams(params: URLSearchParams): ParticipantFilter {
  const payment = params.get('payment') as PaymentFilter
  const checkin = params.get('checkin') as CheckinFilter
  return {
    q: (params.get('q') ?? '').slice(0, 100),
    payment: PAYMENT_VALUES.includes(payment) ? payment : 'semua',
    checkin: CHECKIN_VALUES.includes(checkin) ? checkin : 'semua',
  }
}
