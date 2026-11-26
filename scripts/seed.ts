/**
 * SEED DATA DEMO
 *
 *   npm run seed            -> isi data demo (menolak jalan kalau sudah ada peserta)
 *   npm run seed -- --reset -> HAPUS semua peserta & check-in, lalu isi ulang
 *
 * Yang dibuat:
 *   - akun admin demo (SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD) + baris di tabel admins
 *   - 30 peserta dengan status pembayaran bervariasi
 *   - file bukti transfer dummy di bucket private untuk peserta yang sudah upload
 *   - check-in untuk sebagian peserta lunas
 *
 * Memakai SECRET KEY karena perlu membuat user Auth, mengunggah ke Storage,
 * dan menulis langsung ke tabel (melewati RLS). Jangan jalankan di database
 * yang berisi data peserta sungguhan.
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import type { Database, PaymentStatus } from '../src/types/database'

const BUCKET = 'payment-proofs'
const RESET = process.argv.includes('--reset')

function env(name: string): string {
  const value = process.env[name]
  if (!value) {
    console.error(`✗ ${name} belum diisi di .env.local`)
    process.exit(1)
  }
  return value
}

const supabase = createClient<Database>(
  env('NEXT_PUBLIC_SUPABASE_URL'),
  env('SUPABASE_SECRET_KEY'),
  { auth: { persistSession: false, autoRefreshToken: false } },
)

// ---------------------------------------------------------------------------
// Data dummy
// ---------------------------------------------------------------------------

const NAMES = [
  'Aditya Pratama',
  'Ayu Lestari',
  'Bagus Setiawan',
  'Citra Maharani',
  'Dimas Saputra',
  'Dewi Anggraini',
  'Eko Wahyudi',
  'Fitri Handayani',
  'Galih Ramadhan',
  'Hana Pertiwi',
  'Indra Kusuma',
  'Intan Permatasari',
  'Joko Susilo',
  'Kartika Sari',
  'Lukman Hakim',
  'Maya Puspita',
  'Nanda Firmansyah',
  'Nur Aisyah',
  'Oki Prasetyo',
  'Putri Ramadhani',
  'Rizky Maulana',
  'Rani Oktaviani',
  'Satria Nugraha',
  'Salsabila Zahra',
  'Taufik Hidayat',
  'Tiara Anjani',
  'Umar Faruq',
  'Vina Melati',
  'Wahyu Kurniawan',
  'Yuni Safitri',
]

const MAJORS = ['Manajemen', 'Kewirausahaan', 'Akuntansi', 'Sistem Informasi', 'Teknik Informatika']

const REJECTION_REASONS = [
  'Nominal transfer tidak sesuai (Rp40.000).',
  'Gambar bukti transfer buram, nama pengirim tidak terbaca.',
  'Bukti transfer yang diunggah adalah screenshot keranjang belanja, bukan bukti transfer.',
]

/**
 * Pembagian 30 peserta:
 *   5 menunggu_pembayaran, 6 menunggu_verifikasi, 3 ditolak, 16 lunas
 *   10 dari 16 peserta lunas sudah check-in.
 */
function statusFor(index: number): PaymentStatus {
  if (index < 5) return 'menunggu_pembayaran'
  if (index < 11) return 'menunggu_verifikasi'
  if (index < 14) return 'ditolak'
  return 'lunas'
}
const CHECKED_IN_COUNT = 10

const HOUR = 60 * 60 * 1000
const now = Date.now()

// ---------------------------------------------------------------------------

async function ensureAdmin(): Promise<string> {
  const email = env('SEED_ADMIN_EMAIL')
  const password = env('SEED_ADMIN_PASSWORD')

  const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (listError) throw listError
  let user = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())

  if (user) {
    const { error } = await supabase.auth.admin.updateUserById(user.id, { password })
    if (error) throw error
    console.log(`✓ Admin sudah ada, password diperbarui: ${email}`)
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (error) throw error
    user = data.user
    console.log(`✓ Admin dibuat: ${email}`)
  }

  const { error: adminError } = await supabase.from('admins').upsert({ user_id: user.id })
  if (adminError) throw adminError
  return user.id
}

async function resetData() {
  const { count, error } = await supabase
    .from('participants')
    .select('id', { count: 'exact', head: true })
  if (error) throw error

  if (count && count > 0 && !RESET) {
    console.error(
      `✗ Sudah ada ${count} peserta. Jalankan "npm run seed -- --reset" untuk menghapus dan mengisi ulang.`,
    )
    process.exit(1)
  }

  if (count && count > 0) {
    // checkins ikut terhapus karena ON DELETE CASCADE.
    const { error: deleteError } = await supabase
      .from('participants')
      .delete()
      .not('id', 'is', null)
    if (deleteError) throw deleteError
    console.log(`✓ ${count} peserta lama dihapus`)
  }

  // Bersihkan file bukti lama (struktur folder: <participant_id>/<file>).
  const { data: folders } = await supabase.storage.from(BUCKET).list('', { limit: 1000 })
  for (const folder of folders ?? []) {
    const { data: files } = await supabase.storage.from(BUCKET).list(folder.name)
    const paths = (files ?? []).map((f) => `${folder.name}/${f.name}`)
    if (paths.length) await supabase.storage.from(BUCKET).remove(paths)
  }
}

async function main() {
  console.log('Seeding data demo...\n')
  const adminId = await ensureAdmin()
  await resetData()

  const proofImage = await readFile(
    path.join(import.meta.dirname, 'assets/bukti-transfer-dummy.png'),
  )

  // 1. Peserta (status awal semua menunggu_pembayaran, diperbarui di langkah 3).
  const rows = NAMES.map((name, i) => {
    const [first, last] = name.toLowerCase().split(' ')
    return {
      full_name: name,
      nim: `120223${String(i + 1).padStart(4, '0')}`,
      email: `${first}.${last}@student.example.ac.id`,
      phone: `6281200${String(100000 + i).padStart(6, '0')}`,
      major: MAJORS[i % MAJORS.length],
      // Pendaftaran tersebar dalam 10 hari terakhir.
      created_at: new Date(now - (30 - i) * 8 * HOUR).toISOString(),
    }
  })

  const { data: inserted, error: insertError } = await supabase
    .from('participants')
    .insert(rows)
    .select('id, full_name, token, created_at')
  if (insertError) throw insertError
  console.log(`✓ ${inserted.length} peserta dibuat`)

  // Urutkan sesuai urutan NAMES agar pembagian status konsisten.
  const participants = NAMES.map((name) => inserted.find((p) => p.full_name === name)!)

  // 2. Upload bukti + 3. update status.
  for (const [i, p] of participants.entries()) {
    const status = statusFor(i)
    if (status === 'menunggu_pembayaran') continue

    const proofPath = `${p.id}/seed-bukti-transfer.png`
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(proofPath, proofImage, { contentType: 'image/png', upsert: true })
    if (uploadError) throw uploadError

    const uploadedAt = new Date(new Date(p.created_at).getTime() + 2 * HOUR)
    const verifiedAt = new Date(uploadedAt.getTime() + 5 * HOUR)
    const verified = status === 'lunas' || status === 'ditolak'

    const { error: updateError } = await supabase
      .from('participants')
      .update({
        payment_status: status,
        payment_proof_path: proofPath,
        proof_uploaded_at: uploadedAt.toISOString(),
        rejection_reason:
          status === 'ditolak' ? REJECTION_REASONS[i % REJECTION_REASONS.length] : null,
        verified_at: verified ? verifiedAt.toISOString() : null,
        verified_by: verified ? adminId : null,
      })
      .eq('id', p.id)
    if (updateError) throw updateError
  }
  console.log('✓ Bukti transfer diunggah dan status pembayaran diatur')

  // 4. Check-in untuk sebagian peserta lunas.
  const paid = participants.filter((_, i) => statusFor(i) === 'lunas')
  const checkins = paid.slice(0, CHECKED_IN_COUNT).map((p, i) => ({
    participant_id: p.id,
    checked_in_by: adminId,
    checked_in_at: new Date(now - (CHECKED_IN_COUNT - i) * 3 * 60 * 1000).toISOString(),
  }))
  const { error: checkinError } = await supabase.from('checkins').insert(checkins)
  if (checkinError) throw checkinError
  console.log(`✓ ${checkins.length} check-in dibuat`)

  // Ringkasan + link contoh untuk presentasi.
  const checkedInIds = new Set(checkins.map((c) => c.participant_id))
  const sample = (status: PaymentStatus, checkedIn = false) => {
    const p = participants.find(
      (p, i) => statusFor(i) === status && checkedInIds.has(p.id) === checkedIn,
    )
    return p ? { nama: p.full_name, link: `/status/${p.token}` } : undefined
  }

  console.log('\nContoh halaman status untuk demo:')
  console.table({
    'Menunggu pembayaran': sample('menunggu_pembayaran'),
    'Menunggu verifikasi': sample('menunggu_verifikasi'),
    Ditolak: sample('ditolak'),
    'Lunas, belum check-in': sample('lunas', false),
    'Lunas, sudah check-in': sample('lunas', true),
  })

  console.log(`\nLogin admin: ${env('SEED_ADMIN_EMAIL')} di /admin/login`)
  console.log('Selesai.')
}

main().catch((error) => {
  console.error('\n✗ Seed gagal:', error.message ?? error)
  process.exit(1)
})
