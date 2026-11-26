'use server'

import { redirect } from 'next/navigation'
import { eventConfig } from '@/config/event'
import { createSupabasePublicClient } from '@/lib/supabase/public'
import { registrationSchema, type RegistrationField } from '@/lib/validation'

export type RegistrationState = {
  message?: string
  fieldErrors?: Partial<Record<RegistrationField, string>>
}

/**
 * Server Action pendaftaran. Dipanggil oleh <form> di /daftar.
 *
 * Validasi di browser hanya untuk kenyamanan; di sini semuanya divalidasi ulang
 * karena siapa pun bisa mengirim POST langsung ke action ini.
 */
export async function registerParticipant(
  _prev: RegistrationState,
  formData: FormData,
): Promise<RegistrationState> {
  if (!eventConfig.registration.open) {
    return { message: eventConfig.registration.closedMessage }
  }

  // Honeypot: input tersembunyi yang tidak terlihat manusia. Bot yang mengisi
  // semua field akan terjebak di sini.
  if (formData.get('website')) {
    return { message: 'Pendaftaran gagal. Silakan coba lagi.' }
  }

  if (formData.get('consent') !== 'on') {
    return { message: 'Centang persetujuan penggunaan data untuk melanjutkan.' }
  }

  const parsed = registrationSchema.safeParse({
    fullName: formData.get('fullName') ?? '',
    nim: formData.get('nim') ?? '',
    email: formData.get('email') ?? '',
    phone: formData.get('phone') ?? '',
    major: formData.get('major') ?? '',
  })

  if (!parsed.success) {
    const fieldErrors: RegistrationState['fieldErrors'] = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as RegistrationField
      fieldErrors[field] ??= issue.message
    }
    return { message: 'Periksa kembali data yang ditandai.', fieldErrors }
  }

  const data = parsed.data
  const supabase = createSupabasePublicClient()
  const { data: token, error } = await supabase.rpc('register_participant', {
    p_full_name: data.fullName,
    p_nim: data.nim,
    p_email: data.email,
    p_phone: data.phone,
    p_major: data.major,
  })

  if (error) {
    // 23505 = unique_violation. Nama constraint memberi tahu kolom mana yang ganda.
    if (error.code === '23505') {
      if (error.message.includes('participants_nim_key')) {
        return {
          fieldErrors: {
            nim: 'NIM ini sudah terdaftar. Kehilangan link status? Hubungi narahubung panitia.',
          },
        }
      }
      if (error.message.includes('participants_email_key')) {
        return { fieldErrors: { email: 'Email ini sudah dipakai untuk mendaftar.' } }
      }
    }
    console.error('register_participant gagal', { code: error.code, message: error.message })
    return { message: 'Terjadi kesalahan di server. Coba beberapa saat lagi.' }
  }

  // redirect() melempar exception khusus, jadi dipanggil di luar blok error.
  redirect(`/status/${token}?baru=1`)
}
