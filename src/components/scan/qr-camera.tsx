'use client'

import { useEffect, useRef, useState } from 'react'
import type QrScanner from 'qr-scanner'
import { Camera, Flashlight, FlashlightOff, Loader2 } from 'lucide-react'
import { buttonClass } from '@/components/ui/button'

type Status = 'idle' | 'starting' | 'running' | 'error'

function cameraErrorMessage(error: unknown): string {
  const name = error instanceof Error ? error.name : String(error)
  if (!window.isSecureContext) return 'Kamera hanya bisa dipakai lewat HTTPS.'
  if (/NotAllowed|Permission/i.test(name)) {
    return 'Izin kamera ditolak. Izinkan akses kamera di pengaturan browser, lalu muat ulang halaman.'
  }
  if (/NotFound|no camera/i.test(name)) return 'Kamera tidak ditemukan di perangkat ini.'
  if (/NotReadable/i.test(name))
    return 'Kamera sedang dipakai aplikasi lain. Tutup aplikasi itu lalu coba lagi.'
  return 'Kamera gagal dinyalakan. Gunakan check-in manual.'
}

/**
 * Pembungkus library qr-scanner. Semua detail library ada di file ini, jadi
 * kalau suatu saat ingin ganti library, cukup ubah satu komponen.
 *
 * qr-scanner memproses gambar di Web Worker (UI tidak patah-patah) dan memakai
 * BarcodeDetector bawaan browser kalau tersedia (lebih cepat di Android).
 */
export function QrCamera({
  onScan,
  onStart,
  active = true,
}: {
  onScan: (text: string) => void
  onStart?: () => void
  /** false = kamera dijeda (misal saat tab Manual dibuka) supaya tidak memindai diam-diam. */
  active?: boolean
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<QrScanner | null>(null)
  const onScanRef = useRef(onScan)
  const activeRef = useRef(active)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [hasFlash, setHasFlash] = useState(false)
  const [flashOn, setFlashOn] = useState(false)

  useEffect(() => {
    onScanRef.current = onScan
    activeRef.current = active
  }, [onScan, active])

  async function start() {
    if (!videoRef.current) return
    onStart?.() // dipanggil dari klik tombol: kesempatan membuka izin audio
    setStatus('starting')
    setError(null)
    try {
      const { default: QrScannerLib } = await import('qr-scanner')
      const scanner = new QrScannerLib(
        videoRef.current,
        (result) => onScanRef.current(result.data),
        {
          returnDetailedScanResult: true,
          preferredCamera: 'environment',
          maxScansPerSecond: 8,
          highlightScanRegion: true,
          highlightCodeOutline: true,
        },
      )
      scannerRef.current = scanner
      await scanner.start()
      setHasFlash(await scanner.hasFlash())
      setStatus('running')
    } catch (err) {
      scannerRef.current?.destroy()
      scannerRef.current = null
      setError(cameraErrorMessage(err))
      setStatus('error')
    }
  }

  async function toggleFlash() {
    const scanner = scannerRef.current
    if (!scanner) return
    await scanner.toggleFlash()
    setFlashOn(scanner.isFlashOn())
  }

  // Jeda/lanjutkan kamera mengikuti prop `active`.
  useEffect(() => {
    const scanner = scannerRef.current
    if (!scanner) return
    if (active) void scanner.start()
    else void scanner.pause()
  }, [active])

  // Matikan kamera saat tab disembunyikan (hemat baterai), nyalakan lagi saat kembali.
  useEffect(() => {
    function onVisibility() {
      const scanner = scannerRef.current
      if (!scanner) return
      if (document.visibilityState === 'hidden') scanner.stop()
      else if (!activeRef.current) return
      else void scanner.start()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      scannerRef.current?.destroy()
      scannerRef.current = null
    }
  }, [])

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-900 sm:aspect-square">
      <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />

      {status !== 'running' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-white">
          {status === 'starting' ? (
            <>
              <Loader2 className="size-8 animate-spin" aria-hidden />
              <p>Menyalakan kamera...</p>
            </>
          ) : (
            <>
              <Camera className="size-10 opacity-80" aria-hidden />
              {error && <p className="text-sm text-red-200">{error}</p>}
              <button type="button" onClick={start} className={buttonClass('accent', 'lg')}>
                {error ? 'Coba lagi' : 'Mulai scan'}
              </button>
            </>
          )}
        </div>
      )}

      {status === 'running' && hasFlash && (
        <button
          type="button"
          onClick={toggleFlash}
          className="absolute top-3 right-3 rounded-full bg-black/50 p-3 text-white"
          aria-label={flashOn ? 'Matikan senter' : 'Nyalakan senter'}
        >
          {flashOn ? <FlashlightOff className="size-5" /> : <Flashlight className="size-5" />}
        </button>
      )}
    </div>
  )
}
