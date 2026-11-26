import 'server-only'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type AdminSession =
  | { status: 'anonymous' }
  | { status: 'not_admin'; email: string | null }
  | { status: 'admin'; userId: string; email: string | null }

/**
 * Satu-satunya tempat untuk menentukan "siapa yang sedang login" di server
 * (pola Data Access Layer). Dipakai layout admin, Server Actions, dan route export.
 */
export async function getAdminSession(): Promise<AdminSession> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims) return { status: 'anonymous' }

  const email = typeof claims.email === 'string' ? claims.email : null
  const { data: isAdmin, error } = await supabase.rpc('is_admin')
  if (error || !isAdmin) return { status: 'not_admin', email }

  return { status: 'admin', userId: claims.sub, email }
}
