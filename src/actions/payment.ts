'use server'

import { refresh } from 'next/cache'
import { createSupabasePublicClient } from '@/lib/supabase/public'
import { tokenSchema } from '@/lib/validation'

export type ConfirmProofResult = { ok: true } | { ok: false; message: string }

/**
 * Dipanggil setelah browser selesai mengunggah file ke Storage.
 *
 * Alur upload bukti transfer:
 *   1. Browser mengunggah langsung ke bucket private, ke folder `<token>/`.
 *      Policy Storage menolak kalau token tidak dikenal atau status tidak boleh upload.
 *   2. Action ini memanggil submit_payment_proof, yang memeriksa ulang path dan
 *      memastikan file benar-benar ada, lalu mengubah status menjadi menunggu_verifikasi.
 *
 * File tidak pernah lewat server Next.js, jadi tidak terbentur batas ukuran body
 * Server Action dan tidak ada secret key yang dibutuhkan.
 */
export async function confirmProofUpload(token: string, path: string): Promise<ConfirmProofResult> {
  if (!tokenSchema.safeParse(token).success) return { ok: false, message: 'Link tidak valid.' }

  const supabase = createSupabasePublicClient()
  const { error } = await supabase.rpc('submit_payment_proof', { p_token: token, p_path: path })

  if (error) {
    console.error('submit_payment_proof gagal', error.message)
    return { ok: false, message: 'Gagal menyimpan bukti transfer. Coba unggah ulang.' }
  }

  // Render ulang halaman status di respons yang sama: status jadi menunggu verifikasi.
  refresh()
  return { ok: true }
}
