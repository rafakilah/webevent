/**
 * DEMO ANTI RACE CONDITION
 *
 *   npm run test:race
 *
 * Login sebagai admin demo, pilih satu peserta lunas yang belum check-in, lalu
 * mengirim 20 request check-in untuk tiket yang sama SECARA BERSAMAAN (seolah
 * 20 panitia men-scan QR yang sama di detik yang sama).
 *
 * Hasil yang benar: tepat 1 "berhasil", 19 "sudah", dan hanya 1 baris di tabel
 * checkins. Setelah itu check-in dibatalkan lagi supaya data demo tetap rapi.
 *
 * Hanya butuh publishable key + akun admin (tidak perlu secret key), karena
 * admin memang boleh membaca peserta dan mencatat check-in lewat RLS.
 */
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/types/database'

const PARALLEL = 20

function env(name: string): string {
  const value = process.env[name]
  if (!value) {
    console.error(`✗ ${name} belum diisi di .env.local`)
    process.exit(1)
  }
  return value
}

async function main() {
  const url = env('NEXT_PUBLIC_SUPABASE_URL')
  const key = env('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')

  const admin = createClient<Database>(url, key, { auth: { persistSession: false } })
  const { data: login, error: loginError } = await admin.auth.signInWithPassword({
    email: env('SEED_ADMIN_EMAIL'),
    password: env('SEED_ADMIN_PASSWORD'),
  })
  if (loginError) throw loginError

  // Cari peserta lunas yang belum check-in (dibaca sebagai admin, lewat RLS).
  const { data: candidates, error } = await admin
    .from('participants')
    .select('id, full_name, token, checkins(id)')
    .eq('payment_status', 'lunas')
  if (error) throw error
  const target = candidates.find((p) => !p.checkins)
  if (!target) throw new Error('Tidak ada peserta lunas yang belum check-in. Jalankan seed dulu.')

  // 20 "perangkat panitia", masing-masing client terpisah dengan sesi admin yang sama.
  const devices = Array.from({ length: PARALLEL }, () =>
    createClient<Database>(url, key, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${login.session.access_token}` } },
    }),
  )

  console.log(`Target: ${target.full_name}`)
  console.log(`Mengirim ${PARALLEL} check-in bersamaan...\n`)

  const results = await Promise.all(
    devices.map((client) => client.rpc('check_in', { p_token: target.token })),
  )

  const tally: Record<string, number> = {}
  for (const { data, error: rpcError } of results) {
    const resultKey = rpcError ? `error: ${rpcError.message}` : data[0].result
    tally[resultKey] = (tally[resultKey] ?? 0) + 1
  }
  console.table(tally)

  const { count } = await admin
    .from('checkins')
    .select('id', { count: 'exact', head: true })
    .eq('participant_id', target.id)
  console.log(`Baris di tabel checkins untuk peserta ini: ${count}`)

  const passed = tally.berhasil === 1 && tally.sudah === PARALLEL - 1 && count === 1
  console.log(passed ? '\n✓ LULUS: check-in tercatat tepat satu kali' : '\n✗ GAGAL')

  await admin.rpc('undo_check_in', { p_participant_id: target.id })
  console.log('(check-in dibatalkan lagi agar data demo tidak berubah)')
  process.exit(passed ? 0 : 1)
}

main().catch((error) => {
  console.error('✗', error.message ?? error)
  process.exit(1)
})
