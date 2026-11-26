import { describe, expect, it } from 'vitest'
import { formatPhone, formatRupiah, normalizePhone, paymentDeadline, whatsappLink } from './format'

describe('format', () => {
  it('formatRupiah tanpa desimal', () => {
    expect(formatRupiah(50_000).replace(/\s/g, ' ')).toBe('Rp 50.000')
  })

  it('normalizePhone menerima berbagai penulisan dan menolak nomor rumah', () => {
    expect(normalizePhone('0812-3456-7890')).toBe('6281234567890')
    expect(normalizePhone('+62 812 3456 7890')).toBe('6281234567890')
    expect(normalizePhone('(0812) 3456.7890')).toBe('6281234567890')
    expect(normalizePhone('022-1234567')).toBeNull()
  })

  it('formatPhone menampilkan format lokal', () => {
    expect(formatPhone('6281234567890')).toBe('0812-3456-7890')
  })

  it('paymentDeadline = waktu daftar + 24 jam (sesuai config)', () => {
    expect(paymentDeadline('2026-11-26T10:00:00Z').toISOString()).toBe('2026-11-27T10:00:00.000Z')
  })

  it('whatsappLink meng-encode pesan', () => {
    expect(whatsappLink('6281200000001', 'Halo kak & panitia')).toBe(
      'https://wa.me/6281200000001?text=Halo%20kak%20%26%20panitia',
    )
  })
})
