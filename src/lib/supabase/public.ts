import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { publicEnv } from '@/lib/env'

/**
 * Client anonim tanpa cookie untuk aksi publik (daftar, cek status, upload).
 * Berjalan sebagai role `anon`, jadi hanya bisa memanggil fungsi publik yang
 * diizinkan migration. Tidak membaca sesi admin sama sekali.
 */
export function createSupabasePublicClient() {
  return createClient<Database>(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
