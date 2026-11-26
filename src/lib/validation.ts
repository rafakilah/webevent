import { z } from 'zod'
import { eventConfig } from '@/config/event'
import { normalizePhone } from '@/lib/format'

/**
 * Skema validasi pendaftaran. Dipakai di DUA tempat:
 *   - browser, untuk pesan error instan,
 *   - Server Action, karena input dari browser tidak boleh dipercaya.
 * Database juga punya CHECK constraint sebagai lapisan terakhir.
 */
export const registrationSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, 'Nama minimal 3 karakter')
    .max(100, 'Nama maksimal 100 karakter')
    .regex(/^\p{L}[\p{L} .'-]*$/u, 'Nama hanya boleh berisi huruf, spasi, titik, dan tanda petik'),
  nim: z
    .string()
    .trim()
    .regex(
      new RegExp(eventConfig.registration.nimPattern),
      `NIM harus ${eventConfig.registration.nimHint}`,
    ),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, 'Email terlalu panjang')
    .pipe(z.email('Format email tidak valid')),
  phone: z
    .string()
    .trim()
    .transform((value, ctx) => {
      const normalized = normalizePhone(value)
      if (!normalized) {
        ctx.issues.push({
          code: 'custom',
          message: 'Nomor WA tidak valid. Contoh: 0812-3456-7890',
          input: value,
        })
        return z.NEVER
      }
      return normalized
    }),
  major: z
    .string()
    .trim()
    .min(2, 'Fakultas/jurusan wajib diisi')
    .max(100, 'Fakultas/jurusan maksimal 100 karakter'),
})

export type RegistrationInput = z.input<typeof registrationSchema>
export type RegistrationData = z.output<typeof registrationSchema>
export type RegistrationField = keyof RegistrationInput

/** Bukti transfer: hanya gambar, maksimal 2 MB (sama dengan aturan bucket). */
export const PROOF_MAX_BYTES = 2 * 1024 * 1024
export const PROOF_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export const proofFileSchema = z.object({
  type: z.enum(PROOF_MIME_TYPES, 'File harus berupa gambar JPG, PNG, atau WEBP'),
  size: z.number().positive('File kosong').max(PROOF_MAX_BYTES, 'Ukuran file maksimal 2 MB'),
})

/** Token peserta: 32 karakter hex (lihat default kolom token di migration). */
export const tokenSchema = z.string().regex(/^[0-9a-f]{32}$/)
