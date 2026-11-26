import Link from 'next/link'
import { Check } from 'lucide-react'
import { eventConfig } from '@/config/event'
import { formatRupiah } from '@/lib/format'
import { buttonClass } from '@/components/ui/button'
import { Section } from '@/components/ui/section'

const STEPS = [
  { title: 'Isi formulir', body: 'Nama, NIM, email, nomor WA, dan jurusan.' },
  { title: 'Transfer', body: 'Nomor rekening dan nominal muncul di halaman status.' },
  { title: 'Unggah bukti', body: 'Foto atau screenshot bukti transfer, maksimal 2 MB.' },
  { title: 'Dapat tiket QR', body: 'Muncul otomatis setelah panitia memverifikasi.' },
]

export function Ticket() {
  const { ticket, payment, registration } = eventConfig

  return (
    <Section id="tiket" eyebrow="Tiket" title="Harga tiket dan cara daftar" className="bg-slate-50">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col rounded-2xl bg-white p-6 ring-2 ring-brand-600 sm:p-8">
          <p className="font-semibold text-brand-700">{ticket.name}</p>
          <p className="mt-2 text-4xl font-extrabold tracking-tight">
            {formatRupiah(ticket.price)}
          </p>
          <ul className="mt-6 space-y-3">
            {ticket.benefits.map((benefit) => (
              <li key={benefit} className="flex gap-3 text-slate-700">
                <Check className="size-5 shrink-0 text-brand-600" aria-hidden />
                {benefit}
              </li>
            ))}
          </ul>
          <div className="mt-8 pt-2 lg:mt-auto">
            {registration.open ? (
              <Link href="/daftar" className={buttonClass('primary', 'lg', 'w-full')}>
                Daftar Sekarang
              </Link>
            ) : (
              <p className="rounded-xl bg-slate-100 p-4 text-center text-sm text-slate-600">
                {registration.closedMessage}
              </p>
            )}
            <p className="mt-3 text-center text-xs text-slate-500">
              Bayar via transfer bank, maksimal {payment.deadlineHours} jam setelah daftar.
            </p>
          </div>
        </div>

        <ol className="space-y-3">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="flex gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                {index + 1}
              </span>
              <div>
                <p className="font-semibold">{step.title}</p>
                <p className="text-sm text-slate-600">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  )
}
