import type { SupabaseClient } from '@supabase/supabase-js'
import type { CheckInResult, Database } from '@/types/database'

export type CheckInOutcome =
  | {
      kind: CheckInResult
      fullName: string | null
      nim: string | null
      major: string | null
      checkedInAt: string | null
    }
  | { kind: 'bukan_tiket' } // QR berhasil dibaca tapi isinya bukan token tiket
  | { kind: 'gagal_jaringan'; message: string }

const TOKEN_PATTERN = /^[0-9a-f]{32}$/

/** Cek format di HP dulu: QR asing (link, teks) langsung ditolak tanpa request. */
export function isTicketToken(text: string): boolean {
  return TOKEN_PATTERN.test(text.trim())
}

const TIMEOUT_MS = 8000

async function callCheckIn(
  supabase: SupabaseClient<Database>,
  target: { token: string } | { participantId: string },
) {
  const args =
    'token' in target ? { p_token: target.token } : { p_participant_id: target.participantId }
  return supabase.rpc('check_in', args).abortSignal(AbortSignal.timeout(TIMEOUT_MS))
}

/**
 * Check-in langsung dari browser ke Supabase (satu request kecil, tanpa lewat
 * server Next.js), supaya tetap cepat di sinyal lemah.
 *
 * Kalau request pertama gagal karena jaringan, dicoba sekali lagi. Ini aman
 * karena check_in idempoten: kalau ternyata request pertama sudah sampai,
 * request kedua hanya mendapat "sudah" dengan jam yang sama. Jam itu kita
 * bandingkan dengan waktu mulai scan untuk membedakan "baru saja kita yang
 * mencatat" dari "memang sudah check-in sebelumnya".
 */
export async function performCheckIn(
  supabase: SupabaseClient<Database>,
  target: { token: string } | { participantId: string },
): Promise<CheckInOutcome> {
  const startedAt = Date.now()
  let retried = false

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { data, error } = await callCheckIn(supabase, target)
      if (error) {
        if (error.code === '42501') {
          return { kind: 'gagal_jaringan', message: 'Sesi bukan admin. Login ulang.' }
        }
        throw new Error(error.message)
      }
      const row = data[0]
      let kind = row.result
      const firstCheckIn = row.checked_in_at ? new Date(row.checked_in_at).getTime() : 0
      if (retried && kind === 'sudah' && firstCheckIn >= startedAt - 2000) kind = 'berhasil'
      return {
        kind,
        fullName: row.full_name,
        nim: row.nim,
        major: row.major,
        checkedInAt: row.checked_in_at,
      }
    } catch (error) {
      if (attempt === 1) {
        const offline = typeof navigator !== 'undefined' && !navigator.onLine
        return {
          kind: 'gagal_jaringan',
          message: offline
            ? 'HP sedang offline. Cek sinyal lalu scan ulang.'
            : 'Koneksi lambat atau terputus. Scan ulang.',
        }
      }
      retried = true
      console.warn('check-in gagal, mencoba lagi', error)
    }
  }
  return { kind: 'gagal_jaringan', message: 'Coba lagi.' }
}
