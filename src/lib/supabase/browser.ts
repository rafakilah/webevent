import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { publicEnv } from '@/lib/env'

/** Client untuk komponen 'use client' (realtime, upload, scanner). */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey)
}
