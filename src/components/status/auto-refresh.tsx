'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Selama bukti menunggu verifikasi, ambil ulang data halaman setiap 20 detik
 * dan setiap kali tab kembali dibuka. Begitu panitia menerima pembayaran,
 * tiket QR muncul tanpa peserta harus me-refresh manual.
 *
 * Kenapa polling, bukan Realtime? Realtime butuh izin SELECT untuk role anon,
 * padahal anon sengaja tidak diberi akses ke tabel sama sekali.
 */
export function AutoRefresh({ intervalMs = 20_000 }: { intervalMs?: number }) {
  const router = useRouter()

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') router.refresh()
    }
    const id = setInterval(refreshIfVisible, intervalMs)
    document.addEventListener('visibilitychange', refreshIfVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', refreshIfVisible)
    }
  }, [router, intervalMs])

  return null
}
