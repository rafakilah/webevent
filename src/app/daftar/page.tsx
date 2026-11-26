import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, MapPin, Ticket } from 'lucide-react'
import { eventConfig } from '@/config/event'
import { formatLongDate, formatRupiah } from '@/lib/format'
import { RegistrationForm } from '@/components/registration/registration-form'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { buttonClass } from '@/components/ui/button'
import { Container } from '@/components/ui/section'

export const metadata: Metadata = {
  title: 'Daftar',
  description: `Formulir pendaftaran ${eventConfig.name}.`,
}

export default function RegisterPage() {
  const { registration, ticket, payment } = eventConfig

  return (
    <>
      <SiteHeader showCta={false} />
      <main className="flex-1 bg-slate-50 py-8 sm:py-12">
        <Container className="max-w-xl">
          <Link href="/" className={buttonClass('ghost', 'sm', 'mb-4 -ml-3')}>
            <ArrowLeft className="size-4" aria-hidden /> Kembali
          </Link>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Daftar {eventConfig.name}
          </h1>

          <ul className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
            <li className="flex items-center gap-2">
              <CalendarDays className="size-4 text-brand-600" aria-hidden />
              {formatLongDate(eventConfig.startsAt)}
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="size-4 text-brand-600" aria-hidden />
              {eventConfig.venue.name}
            </li>
            <li className="flex items-center gap-2">
              <Ticket className="size-4 text-brand-600" aria-hidden />
              {formatRupiah(ticket.price)}
            </li>
          </ul>

          <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-8">
            {registration.open ? (
              <>
                <p className="mb-6 text-sm text-slate-600">
                  Setelah mendaftar, kamu akan diarahkan ke halaman status berisi instruksi
                  transfer. Batas pembayaran {payment.deadlineHours} jam setelah mendaftar.
                </p>
                <RegistrationForm />
              </>
            ) : (
              <p className="text-center text-slate-600">{registration.closedMessage}</p>
            )}
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  )
}
