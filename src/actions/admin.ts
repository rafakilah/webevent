'use server'

import { refresh } from 'next/cache'
import { z } from 'zod'
import { PAYMENT_PROOF_BUCKET } from '@/lib/env'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; message: string }

const idSchema = z.uuid()

/**
 * Setiap action admin memastikan ada sesi login yang valid (JWT diverifikasi),
 * lalu memanggil fungsi Postgres yang memeriksa is_admin(). Pemeriksaan admin
 * sengaja diserahkan ke database: satu sumber kebenaran, dan tetap berlaku
 * walaupun action ini dipanggil langsung lewat POST oleh orang luar.
 */
async function requireSession() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getClaims()
  return data?.claims ? supabase : null
}

const SESSION_EXPIRED = 'Sesi berakhir. Silakan login ulang.'
const FORBIDDEN = 'Akun ini tidak punya akses panitia.'

export async function verifyPayment(
  participantId: string,
  approve: boolean,
  reason?: string,
): Promise<ActionResult> {
  if (!idSchema.safeParse(participantId).success) return { ok: false, message: 'ID tidak valid.' }
  const cleanReason = reason?.trim() ?? ''
  if (!approve && cleanReason.length < 5) {
    return { ok: false, message: 'Tulis alasan penolakan (minimal 5 karakter).' }
  }
  if (cleanReason.length > 300) return { ok: false, message: 'Alasan maksimal 300 karakter.' }

  const supabase = await requireSession()
  if (!supabase) return { ok: false, message: SESSION_EXPIRED }

  const { error } = await supabase.rpc('verify_payment', {
    p_participant_id: participantId,
    p_approve: approve,
    p_reason: approve ? null : cleanReason,
  })
  if (error) {
    if (error.code === '42501') return { ok: false, message: FORBIDDEN }
    // Paling sering: panitia lain sudah memverifikasi lebih dulu.
    if (error.message.includes('tidak sedang menunggu verifikasi')) {
      refresh()
      return { ok: false, message: 'Peserta ini sudah diverifikasi panitia lain.' }
    }
    console.error('verify_payment gagal', error.message)
    return { ok: false, message: 'Gagal menyimpan verifikasi. Coba lagi.' }
  }

  refresh()
  return { ok: true, data: null }
}

export async function undoCheckIn(participantId: string): Promise<ActionResult> {
  if (!idSchema.safeParse(participantId).success) return { ok: false, message: 'ID tidak valid.' }
  const supabase = await requireSession()
  if (!supabase) return { ok: false, message: SESSION_EXPIRED }

  const { data, error } = await supabase.rpc('undo_check_in', { p_participant_id: participantId })
  if (error) {
    if (error.code === '42501') return { ok: false, message: FORBIDDEN }
    console.error('undo_check_in gagal', error.message)
    return { ok: false, message: 'Gagal membatalkan check-in.' }
  }
  refresh()
  return data ? { ok: true, data: null } : { ok: false, message: 'Peserta ini belum check-in.' }
}

/**
 * Bukti transfer ada di bucket private. Admin mendapat signed URL yang hanya
 * berlaku 5 menit, jadi link yang tersebar tidak bisa dibuka selamanya.
 */
export async function getProofUrl(participantId: string): Promise<ActionResult<string>> {
  if (!idSchema.safeParse(participantId).success) return { ok: false, message: 'ID tidak valid.' }
  const supabase = await requireSession()
  if (!supabase) return { ok: false, message: SESSION_EXPIRED }

  const { data: row, error } = await supabase
    .from('participants')
    .select('payment_proof_path')
    .eq('id', participantId)
    .maybeSingle()
  if (error || !row?.payment_proof_path)
    return { ok: false, message: 'Bukti transfer tidak ditemukan.' }

  const { data, error: signError } = await supabase.storage
    .from(PAYMENT_PROOF_BUCKET)
    .createSignedUrl(row.payment_proof_path, 300)
  if (signError) {
    console.error('createSignedUrl gagal', signError.message)
    return { ok: false, message: 'Gagal memuat bukti transfer.' }
  }
  return { ok: true, data: data.signedUrl }
}
