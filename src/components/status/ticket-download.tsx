'use client'

import { useState } from 'react'
import QRCode from 'qrcode'
import { Download, Loader2 } from 'lucide-react'
import { eventConfig } from '@/config/event'
import { formatLongDate, formatTime } from '@/lib/format'
import { buttonClass } from '@/components/ui/button'

const WIDTH = 1080
const HEIGHT = 1640
const PADDING = 72
const COLORS = {
  header: '#151a3d',
  accent: '#f5c542',
  text: '#0f172a',
  muted: '#64748b',
  line: '#cbd5e1',
}
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

/** Kecilkan ukuran font sampai teks muat dalam lebar yang tersedia. */
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  weight: number,
  size: number,
  maxWidth: number,
) {
  let current = size
  do {
    ctx.font = `${weight} ${current}px ${FONT}`
    current -= 2
  } while (ctx.measureText(text).width > maxWidth && current > 20)
}

/**
 * Menggambar tiket ke <canvas> lalu menyimpannya sebagai PNG.
 * Digambar manual (bukan screenshot DOM seperti html2canvas) supaya hasilnya
 * sama persis di semua HP dan tidak butuh library tambahan.
 */
async function renderTicket(data: { token: string; fullName: string; nim: string; major: string }) {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas tidak didukung')
  const contentWidth = WIDTH - PADDING * 2

  // Latar & header
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
  ctx.fillStyle = COLORS.header
  ctx.fillRect(0, 0, WIDTH, 300)

  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#c7d2fe'
  ctx.font = `500 30px ${FONT}`
  ctx.fillText(`E-TICKET · ${eventConfig.format.toUpperCase()}`, PADDING, 100)
  ctx.fillStyle = '#ffffff'
  fitText(ctx, eventConfig.name, 800, 84, contentWidth)
  ctx.fillText(eventConfig.name, PADDING, 190)
  ctx.fillStyle = COLORS.accent
  fitText(ctx, eventConfig.tagline, 500, 40, contentWidth)
  ctx.fillText(eventConfig.tagline, PADDING, 250)

  // QR
  const qrCanvas = document.createElement('canvas')
  await QRCode.toCanvas(qrCanvas, data.token, {
    width: 600,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: COLORS.text, light: '#ffffff' },
  })
  ctx.drawImage(qrCanvas, (WIDTH - 600) / 2, 360)

  // Data peserta
  ctx.textAlign = 'center'
  ctx.fillStyle = COLORS.text
  fitText(ctx, data.fullName, 700, 60, contentWidth)
  ctx.fillText(data.fullName, WIDTH / 2, 1060)
  ctx.fillStyle = COLORS.muted
  const subline = `${data.nim} · ${data.major}`
  fitText(ctx, subline, 400, 36, contentWidth)
  ctx.fillText(subline, WIDTH / 2, 1115)

  // Garis putus-putus pemisah
  ctx.strokeStyle = COLORS.line
  ctx.lineWidth = 3
  ctx.setLineDash([16, 12])
  ctx.beginPath()
  ctx.moveTo(PADDING, 1180)
  ctx.lineTo(WIDTH - PADDING, 1180)
  ctx.stroke()
  ctx.setLineDash([])

  // Detail event
  const lines = [
    formatLongDate(eventConfig.startsAt),
    `${formatTime(eventConfig.startsAt)} - ${formatTime(eventConfig.endsAt)} WIB`,
    eventConfig.venue.name,
  ]
  ctx.fillStyle = COLORS.text
  lines.forEach((line, index) => {
    fitText(ctx, line, index === 0 ? 600 : 400, 38, contentWidth)
    ctx.fillText(line, WIDTH / 2, 1260 + index * 56)
  })

  ctx.fillStyle = COLORS.muted
  ctx.font = `400 28px ${FONT}`
  ctx.fillText('Tunjukkan QR ini saat registrasi ulang.', WIDTH / 2, 1500)
  ctx.fillText('Jangan bagikan tiket ke orang lain.', WIDTH / 2, 1545)

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Gagal membuat PNG'))),
      'image/png',
    ),
  )
}

export function TicketDownload(props: {
  token: string
  fullName: string
  nim: string
  major: string
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDownload() {
    setBusy(true)
    setError(null)
    try {
      const blob = await renderTicket(props)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `tiket-${eventConfig.name.toLowerCase().replace(/\s+/g, '-')}-${props.nim}.png`
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      setError('Gagal membuat gambar tiket. Kamu tetap bisa screenshot halaman ini.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={handleDownload}
        disabled={busy}
        className={buttonClass('primary', 'lg', 'w-full')}
      >
        {busy ? (
          <Loader2 className="size-5 animate-spin" aria-hidden />
        ) : (
          <Download className="size-5" aria-hidden />
        )}
        Download tiket (PNG)
      </button>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  )
}
