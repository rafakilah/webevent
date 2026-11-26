import { eventConfig } from '@/config/event'

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

/** 50000 -> "Rp 50.000" */
export function formatRupiah(amount: number): string {
  return rupiah.format(amount)
}

/** Format tanggal/jam selalu dalam zona waktu event, bukan zona waktu perangkat. */
export function formatInEventTz(date: Date | string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('id-ID', { timeZone: eventConfig.timeZone, ...options }).format(
    typeof date === 'string' ? new Date(date) : date,
  )
}

/** "Sabtu, 23 Januari 2027" */
export function formatLongDate(date: Date | string): string {
  return formatInEventTz(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

/** "08.00" */
export function formatTime(date: Date | string): string {
  return formatInEventTz(date, { hour: '2-digit', minute: '2-digit', hour12: false })
}

/** "23 Jan 2027, 08.00" */
export function formatDateTime(date: Date | string): string {
  return formatInEventTz(date, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/** Batas waktu transfer = waktu daftar + deadlineHours dari config. */
export function paymentDeadline(registeredAt: Date | string): Date {
  const start = typeof registeredAt === 'string' ? new Date(registeredAt) : registeredAt
  return new Date(start.getTime() + eventConfig.payment.deadlineHours * 60 * 60 * 1000)
}

/**
 * Menormalkan nomor WA Indonesia ke format 628xxxxxxxxx.
 * Menerima "0812-3456-7890", "+62 812 3456 7890", "6281234567890", "812...".
 * Mengembalikan null kalau bukan nomor HP Indonesia yang valid.
 */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/[\s\-().]/g, '')
  if (digits.startsWith('+')) digits = digits.slice(1)
  if (!/^\d+$/.test(digits)) return null

  if (digits.startsWith('62')) digits = digits.slice(2)
  else if (digits.startsWith('0')) digits = digits.slice(1)

  // Nomor seluler Indonesia: 8 diikuti 8 sampai 11 digit (total 9 sampai 12 digit tanpa 0).
  if (!/^8[1-9]\d{7,10}$/.test(digits)) return null
  return `62${digits}`
}

/** 6281234567890 -> "0812-3456-7890" untuk ditampilkan. */
export function formatPhone(normalized: string): string {
  const local = `0${normalized.slice(2)}`
  return local.replace(/^(\d{4})(\d{4})(\d+)$/, '$1-$2-$3')
}

export function whatsappLink(normalized: string, text?: string): string {
  const url = `https://wa.me/${normalized}`
  return text ? `${url}?text=${encodeURIComponent(text)}` : url
}
