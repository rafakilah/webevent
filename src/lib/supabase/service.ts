import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { publicEnv } from '@/lib/env'

/**
 * Client dengan SECRET KEY: melewati RLS. Hanya dipakai di server untuk hal
 * yang memang butuh hak penuh, yaitu membuat signed upload URL bukti transfer
 * setelah token peserta divalidasi. `server-only` membuat build gagal kalau
 * file ini tidak sengaja diimpor dari komponen client.
 */
export function createSupabaseServiceClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY
  if (!secretKey) {
    throw new Error('Environment variable SUPABASE_SECRET_KEY belum diisi. Lihat .env.example.')
  }
  return createClient<Database>(publicEnv.supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
