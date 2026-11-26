import 'server-only'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { publicEnv } from '@/lib/env'

/**
 * Client untuk Server Components, Server Actions, dan Route Handlers.
 * Membaca sesi admin dari cookie, jadi query berjalan sebagai user yang login
 * dan RLS tetap berlaku.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Dipanggil dari Server Component (cookie read-only). Aman diabaikan
          // karena proxy.ts yang bertugas me-refresh sesi.
        }
      },
    },
  })
}
