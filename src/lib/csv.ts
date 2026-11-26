/**
 * Membuat CSV yang aman dibuka di Excel / Google Sheets.
 *
 * - Nilai berisi koma, kutip, atau baris baru dibungkus tanda kutip.
 * - Nilai yang diawali = + - @ diberi awalan ' untuk mencegah "CSV injection"
 *   (rumus berbahaya yang bisa dieksekusi spreadsheet saat file dibuka).
 *   Contoh: peserta mendaftar dengan nama =HYPERLINK("http://jahat",...)
 * - Diawali BOM UTF-8 supaya Excel membaca huruf non-ASCII dengan benar.
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  let text = String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  if (/[",\n\r]/.test(text)) text = `"${text.replace(/"/g, '""')}"`
  return text
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(','))
  return '﻿' + lines.join('\r\n') + '\r\n'
}
