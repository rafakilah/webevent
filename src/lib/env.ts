/**
 * Akses environment variable di satu tempat, supaya error-nya jelas kalau ada
 * yang belum diisi (daripada error misterius dari supabase-js).
 *
 * Catatan: variabel NEXT_PUBLIC_* harus ditulis lengkap (process.env.NAMA)
 * agar Next.js bisa menyisipkannya ke bundle browser saat build.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Environment variable ${name} belum diisi. Lihat .env.example.`)
  }
  return value
}

export const publicEnv = {
  get supabaseUrl() {
    return required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL)
  },
  get supabasePublishableKey() {
    return required(
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    )
  },
}

export const PAYMENT_PROOF_BUCKET = 'payment-proofs'
