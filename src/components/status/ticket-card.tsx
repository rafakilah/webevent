import QRCode from 'qrcode'
import { CheckCircle2 } from 'lucide-react'
import { eventConfig } from '@/config/event'
import { formatLongDate, formatTime } from '@/lib/format'
import type { PublicParticipant } from '@/lib/participant'
import { TicketDownload } from './ticket-download'

/**
 * Tiket digital. QR dibuat di server sebagai SVG: tidak perlu JavaScript untuk
 * menampilkannya, tajam di semua ukuran layar, dan cepat tampil di sinyal lemah.
 *
 * Isi QR hanya token acak. Tidak ada nama, NIM, atau data pribadi lain, jadi
 * foto tiket yang tersebar tidak membocorkan apa pun selain token itu sendiri.
 */
export async function TicketCard({
  token,
  participant,
}: {
  token: string
  participant: PublicParticipant
}) {
  const qrSvg = await QRCode.toString(token, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 1,
    color: { dark: '#0f172a', light: '#ffffff' },
  })

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <header className="bg-brand-950 px-5 py-4 text-white">
        <p className="text-xs text-brand-200">E-ticket · {eventConfig.format}</p>
        <h2 className="text-xl font-bold">{eventConfig.name}</h2>
        <p className="text-sm text-accent-300">{eventConfig.tagline}</p>
      </header>

      <div className="p-5">
        <div
          role="img"
          aria-label="Kode QR tiket"
          className="mx-auto w-full max-w-64 [&>svg]:h-auto [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
        <p className="mt-2 text-center text-xs text-slate-500">
          Tunjukkan QR ini saat registrasi ulang. Naikkan kecerahan layar agar mudah dipindai.
        </p>

        {participant.checked_in_at && (
          <p className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-green-50 p-3 text-sm font-medium text-green-800 ring-1 ring-green-200">
            <CheckCircle2 className="size-5" aria-hidden />
            Sudah check-in pukul {formatTime(participant.checked_in_at)} WIB
          </p>
        )}

        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-dashed border-slate-300 pt-5 text-sm">
          <div className="col-span-2">
            <dt className="text-slate-500">Nama</dt>
            <dd className="text-base font-semibold">{participant.full_name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">NIM</dt>
            <dd className="font-medium tabular-nums">{participant.nim}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Jurusan</dt>
            <dd className="font-medium">{participant.major}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Tanggal</dt>
            <dd className="font-medium">{formatLongDate(eventConfig.startsAt)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Waktu</dt>
            <dd className="font-medium">
              {formatTime(eventConfig.startsAt)} - {formatTime(eventConfig.endsAt)} WIB
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-slate-500">Lokasi</dt>
            <dd className="font-medium">
              {eventConfig.venue.name}, {eventConfig.venue.address}
            </dd>
          </div>
        </dl>

        <TicketDownload
          token={token}
          fullName={participant.full_name}
          nim={participant.nim}
          major={participant.major}
        />
      </div>
    </article>
  )
}
