import type { PaymentStatus } from '@/types/database'

/** Bentuk data peserta di dashboard admin (aman diimpor dari komponen client). */
export type AdminParticipant = {
  id: string
  full_name: string
  nim: string
  email: string
  phone: string
  major: string
  token: string
  payment_status: PaymentStatus
  payment_proof_path: string | null
  proof_uploaded_at: string | null
  rejection_reason: string | null
  verified_at: string | null
  created_at: string
  checked_in_at: string | null
}

export type DashboardStats = {
  total: number
  menunggu_pembayaran: number
  menunggu_verifikasi: number
  lunas: number
  ditolak: number
  checked_in: number
}
