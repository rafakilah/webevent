import { describe, expect, it } from 'vitest'
import {
  DEFAULT_FILTER,
  filterFromSearchParams,
  filterParticipants,
  filterToSearchParams,
} from './participant-filter'

const rows = [
  {
    full_name: 'Ayu Lestari',
    nim: '1202230002',
    email: 'ayu@x.id',
    payment_status: 'lunas',
    checked_in_at: '2027-01-23T01:00:00Z',
  },
  {
    full_name: 'Bagus Setiawan',
    nim: '1202230003',
    email: 'bagus@x.id',
    payment_status: 'lunas',
    checked_in_at: null,
  },
  {
    full_name: 'Citra Maharani',
    nim: '1202230004',
    email: 'citra@x.id',
    payment_status: 'menunggu_verifikasi',
    checked_in_at: null,
  },
] as const

describe('filterParticipants', () => {
  it('tanpa filter mengembalikan semua', () => {
    expect(filterParticipants([...rows], DEFAULT_FILTER)).toHaveLength(3)
  })
  it('mencari nama, NIM, atau email tanpa peduli huruf besar', () => {
    expect(filterParticipants([...rows], { ...DEFAULT_FILTER, q: 'CITRA' })).toHaveLength(1)
    expect(filterParticipants([...rows], { ...DEFAULT_FILTER, q: '230003' })).toHaveLength(1)
    expect(filterParticipants([...rows], { ...DEFAULT_FILTER, q: 'ayu@' })).toHaveLength(1)
  })
  it('menggabungkan filter status bayar dan check-in', () => {
    const result = filterParticipants([...rows], { q: '', payment: 'lunas', checkin: 'belum' })
    expect(result.map((r) => r.full_name)).toEqual(['Bagus Setiawan'])
  })
})

describe('filter <-> query string', () => {
  it('bolak-balik tanpa kehilangan nilai', () => {
    const filter = { q: 'ayu', payment: 'lunas', checkin: 'sudah' } as const
    expect(filterFromSearchParams(filterToSearchParams(filter))).toEqual(filter)
  })
  it('mengabaikan nilai yang tidak dikenal', () => {
    const parsed = filterFromSearchParams(new URLSearchParams('payment=hack&checkin=x'))
    expect(parsed).toEqual(DEFAULT_FILTER)
  })
})
