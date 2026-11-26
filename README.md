# INNOVATE 2027: Platform Event Kampus

Platform event all-in-one: landing page, registrasi, pembayaran via transfer, tiket QR, check-in hari H, dan dashboard panitia.

> README lengkap (fitur, diagram, arsitektur, keputusan teknis) ditulis di Tahap 6. Bagian di bawah ini cukup untuk menjalankan project.

## Status pengerjaan

- [x] Tahap 1: setup project, database, seed
- [x] Tahap 2: landing page + form daftar
- [ ] Tahap 3: halaman status + upload bukti + tiket QR
- [ ] Tahap 4: auth admin + dashboard + verifikasi pembayaran + export
- [ ] Tahap 5: halaman scan + check-in manual
- [ ] Tahap 6: realtime, polishing, README

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage, Realtime) · Vercel

## Menjalankan secara lokal

### 1. Siapkan project Supabase

1. Buat project baru di [supabase.com](https://supabase.com).
2. **Authentication > Sign In / Providers**: matikan _Allow new users to sign up_.
3. **SQL Editor**: salin isi `supabase/migrations/20261126000000_init.sql`, lalu jalankan. Migration ini membuat tabel, fungsi, RLS, bucket `payment-proofs`, dan mengaktifkan Realtime.
4. **Project Settings > API Keys**: salin Project URL, publishable key, dan secret key.

### 2. Isi environment variable

```bash
cp .env.example .env.local
```

Isi nilai dari langkah sebelumnya, lalu tentukan email dan password admin demo.

### 3. Install, seed, jalankan

```bash
npm install
npm run seed
npm run dev
```

`npm run seed` membuat akun admin demo, 30 peserta dengan status bervariasi, file bukti transfer dummy, dan 10 check-in. Script mencetak beberapa link `/status/<token>` untuk demo. Untuk mengulang dari awal: `npm run seed -- --reset`.

## Perintah lain

| Perintah                                                | Fungsi                                           |
| ------------------------------------------------------- | ------------------------------------------------ |
| `npm test`                                              | Unit test validasi (Vitest)                      |
| `npm run test:db`                                       | Tes keamanan RLS ke database di `DATABASE_URL`   |
| `npm run test:race`                                     | Demo 20 check-in bersamaan untuk tiket yang sama |
| `npm run lint` / `npm run typecheck` / `npm run format` | Kualitas kode                                    |

## Struktur folder

```
src/
  app/                 Halaman (App Router)
  config/event.ts      Semua konten event. Ganti file ini untuk event lain.
  lib/                 Supabase client, validasi (zod), format tanggal/rupiah
  types/database.ts    Tipe tabel dan fungsi database
supabase/
  migrations/          Skema, fungsi, RLS, bucket
  tests/               Tes keamanan SQL + stub Supabase untuk CI
scripts/
  seed.ts              Data demo
  race-test.ts         Bukti check-in aman dari race condition
```
