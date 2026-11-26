import 'server-only'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { AdminParticipant, DashboardStats } from '@/types/admin'

export type { AdminParticipant, DashboardStats }

const COLUMNS =
  'id, full_name, nim, email, phone, major, token, payment_status, payment_proof_path, proof_uploaded_at, rejection_reason, verified_at, created_at, checkins(checked_in_at)'

/**
 * Semua peserta beserta waktu check-in. Query berjalan dengan sesi admin, jadi
 * RLS yang menentukan boleh atau tidaknya. Jumlah peserta event kampus biasanya
 * ratusan, jadi aman diambil sekaligus lalu difilter di browser (instan).
 */
export async function getAllParticipants(): Promise<AdminParticipant[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('participants')
    .select(COLUMNS)
    .order('created_at', { ascending: false })
  if (error) throw new Error(`Gagal memuat peserta: ${error.message}`)

  return data.map(({ checkins, ...row }) => ({
    ...row,
    checked_in_at: checkins?.checked_in_at ?? null,
  }))
}

/** Statistik dihitung di database (satu query agregat). */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc('dashboard_stats')
  if (error) throw new Error(`Gagal memuat statistik: ${error.message}`)
  return data[0]
}
