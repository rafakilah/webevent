/**
 * KONFIGURASI EVENT
 *
 * Satu-satunya tempat untuk mengubah konten event. Ganti isi file ini untuk
 * memakai platform yang sama di event lain: landing page, halaman pembayaran,
 * tiket, dan validasi form semuanya membaca dari sini.
 *
 * Tipe `EventConfig` membuat build gagal kalau ada field wajib yang terlewat.
 */

export type Speaker = {
  name: string
  role: string
  topic: string
  /** Path gambar di /public. Kosongkan untuk memakai inisial. */
  photo?: string
}

export type RundownItem = {
  /** Format "HH.MM", waktu lokal event. */
  start: string
  end: string
  title: string
  description?: string
}

export type FaqItem = { question: string; answer: string }

export type Contact = { name: string; role: string; whatsapp: string }

export type BankAccount = { bank: string; accountNumber: string; accountName: string }

export type EventConfig = {
  name: string
  tagline: string
  format: string
  organizer: { name: string; instagram?: string; email?: string }
  about: string[]
  highlights: string[]
  /** ISO 8601 dengan offset zona waktu, contoh "2027-01-23T08:00:00+07:00". */
  startsAt: string
  endsAt: string
  /** Zona waktu IANA untuk menampilkan tanggal dan jam. */
  timeZone: string
  venue: { name: string; address: string; mapsUrl?: string }
  ticket: { name: string; price: number; benefits: string[] }
  payment: {
    /** Batas waktu transfer, dihitung dari waktu pendaftaran. */
    deadlineHours: number
    accounts: BankAccount[]
    notes: string[]
  }
  registration: {
    /** Regex format NIM kampus. */
    nimPattern: string
    nimHint: string
    majorSuggestions: string[]
  }
  speakers: Speaker[]
  rundown: RundownItem[]
  faq: FaqItem[]
  contacts: Contact[]
}

export const eventConfig = {
  name: 'INNOVATE 2027',
  tagline: 'Dari Ide ke Produk Digital',
  format: 'Seminar & Workshop',
  organizer: {
    name: 'SBM',
    instagram: 'innovate.sbm',
    email: 'innovate2027@example.com',
  },
  about: [
    'INNOVATE 2027 adalah seminar dan workshop satu hari untuk mahasiswa yang ingin mengubah ide menjadi produk digital yang benar-benar dipakai orang.',
    'Sesi pagi membahas cara menemukan masalah yang layak diselesaikan dan memvalidasinya dengan cepat. Sesi siang berupa workshop langsung: kamu akan menyusun prototipe dan rencana peluncuran bersama tim.',
  ],
  highlights: [
    '3 pembicara praktisi produk dan startup',
    'Workshop prototyping dalam tim',
    'E-sertifikat dan materi presentasi',
    'Networking dengan mahasiswa lintas jurusan',
  ],
  startsAt: '2027-01-23T08:00:00+07:00',
  endsAt: '2027-01-23T15:00:00+07:00',
  timeZone: 'Asia/Jakarta',
  venue: {
    name: 'Auditorium Gedung C',
    address: 'Kampus Utama, Jl. Contoh Raya No. 10, Bandung',
    mapsUrl: 'https://maps.google.com/?q=Bandung',
  },
  ticket: {
    name: 'Tiket Reguler',
    price: 50_000,
    benefits: [
      'Akses seminar dan workshop',
      'Makan siang dan coffee break',
      'E-sertifikat',
      'Materi presentasi',
    ],
  },
  payment: {
    deadlineHours: 24,
    accounts: [
      { bank: 'BCA', accountNumber: '1234567890', accountName: 'Bendahara INNOVATE 2027' },
      { bank: 'Mandiri', accountNumber: '9876543210123', accountName: 'Bendahara INNOVATE 2027' },
    ],
    notes: [
      'Transfer sesuai nominal agar mudah diverifikasi.',
      'Simpan bukti transfer, lalu unggah di halaman ini.',
      'Verifikasi oleh panitia maksimal 1x24 jam.',
    ],
  },
  registration: {
    nimPattern: '^[0-9]{8,15}$',
    nimHint: '8 sampai 15 digit angka',
    majorSuggestions: [
      'Manajemen',
      'Kewirausahaan',
      'Akuntansi',
      'Ilmu Ekonomi',
      'Teknik Informatika',
      'Sistem Informasi',
      'Desain Komunikasi Visual',
    ],
  },
  speakers: [
    {
      name: 'Raka Pradipta',
      role: 'Head of Product, Lumbung Digital',
      topic: 'Menemukan masalah yang layak diselesaikan',
    },
    {
      name: 'Nadia Kirana',
      role: 'Co-founder, Sapa Kelas',
      topic: 'Validasi ide dalam 7 hari tanpa coding',
    },
    {
      name: 'Bima Santoso',
      role: 'Senior UX Designer, Arunika Studio',
      topic: 'Workshop: dari sketsa ke prototipe',
    },
  ],
  rundown: [
    { start: '07.30', end: '08.00', title: 'Registrasi ulang dan check-in' },
    { start: '08.00', end: '08.20', title: 'Pembukaan dan sambutan' },
    {
      start: '08.20',
      end: '09.30',
      title: 'Sesi 1: Menemukan masalah yang layak diselesaikan',
      description: 'Raka Pradipta',
    },
    {
      start: '09.30',
      end: '10.40',
      title: 'Sesi 2: Validasi ide dalam 7 hari',
      description: 'Nadia Kirana',
    },
    { start: '10.40', end: '11.00', title: 'Coffee break' },
    { start: '11.00', end: '12.00', title: 'Panel diskusi dan tanya jawab' },
    { start: '12.00', end: '13.00', title: 'ISHOMA' },
    {
      start: '13.00',
      end: '14.40',
      title: 'Workshop: dari sketsa ke prototipe',
      description: 'Bima Santoso, kerja dalam tim 4 sampai 5 orang',
    },
    { start: '14.40', end: '15.00', title: 'Presentasi tim terbaik dan penutupan' },
  ],
  faq: [
    {
      question: 'Siapa yang boleh ikut?',
      answer: 'Semua mahasiswa aktif dari jurusan apa pun. Tidak perlu latar belakang teknis.',
    },
    {
      question: 'Apakah perlu membawa laptop?',
      answer: 'Disarankan, terutama untuk sesi workshop. Satu laptop per tim sudah cukup.',
    },
    {
      question: 'Bagaimana cara membayar?',
      answer:
        'Setelah mendaftar, kamu akan diarahkan ke halaman status yang berisi nomor rekening dan nominal. Transfer, lalu unggah bukti transfer di halaman itu.',
    },
    {
      question: 'Berapa lama verifikasi pembayaran?',
      answer:
        'Maksimal 1x24 jam. Status di halaman kamu akan berubah otomatis dan tiket QR muncul begitu pembayaran diterima.',
    },
    {
      question: 'Saya kehilangan link halaman status, bagaimana?',
      answer:
        'Hubungi narahubung panitia dengan menyebutkan NIM kamu. Panitia akan mengirim ulang link-nya.',
    },
    {
      question: 'Apakah tiket bisa dipindahtangankan?',
      answer: 'Tidak. Tiket terikat pada nama dan NIM pendaftar.',
    },
  ],
  contacts: [
    { name: 'Alya', role: 'Narahubung pendaftaran', whatsapp: '6281200000001' },
    { name: 'Fajar', role: 'Narahubung pembayaran', whatsapp: '6281200000002' },
  ],
} satisfies EventConfig
