import 'server-only'
import { createSupabasePublicClient } from '@/lib/supabase/public'
import { tokenSchema } from '@/lib/validation'
import type { Database } from '@/types/database'

export type PublicParticipant =
  Database['public']['Functions']['get_participant_by_token']['Returns'][number]

/**
 * Ambil data peserta untuk halaman status. Token yang formatnya salah langsung
 * ditolak tanpa query ke database.
 */
export async function getParticipantByToken(token: string): Promise<PublicParticipant | null> {
  if (!tokenSchema.safeParse(token).success) return null

  const supabase = createSupabasePublicClient()
  const { data, error } = await supabase.rpc('get_participant_by_token', { p_token: token })
  if (error) {
    console.error('get_participant_by_token gagal', error.message)
    throw new Error('Gagal memuat data pendaftaran')
  }
  return data[0] ?? null
}
