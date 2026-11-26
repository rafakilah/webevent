import Link from 'next/link'
import { CalendarDays, Clock, MapPin } from 'lucide-react'
import { eventConfig } from '@/config/event'
import { formatLongDate, formatTime } from '@/lib/format'
import { buttonClass } from '@/components/ui/button'
import { Container } from '@/components/ui/section'
import { Countdown } from './countdown'

export function Hero() {
  const { registration } = eventConfig

  return (
    <section className="relative overflow-hidden bg-brand-950 text-white">
      {/* Dekorasi latar: cahaya lembut, tidak mengganggu keterbacaan. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_80%_-10%,var(--color-brand-600),transparent_60%),radial-gradient(40rem_20rem_at_0%_110%,var(--color-brand-800),transparent_60%)] opacity-70"
      />
      <Container className="relative grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div>
          <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-sm text-brand-100 ring-1 ring-white/15">
            {eventConfig.organizer.name} mempersembahkan · {eventConfig.format}
          </p>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-6xl">
            {eventConfig.name}
          </h1>
          <p className="mt-3 text-xl text-accent-300 sm:text-2xl">{eventConfig.tagline}</p>

          <ul className="mt-8 space-y-3 text-brand-100">
            <li className="flex items-center gap-3">
              <CalendarDays className="size-5 shrink-0 text-accent-400" aria-hidden />
              {formatLongDate(eventConfig.startsAt)}
            </li>
            <li className="flex items-center gap-3">
              <Clock className="size-5 shrink-0 text-accent-400" aria-hidden />
              {formatTime(eventConfig.startsAt)} sampai {formatTime(eventConfig.endsAt)} WIB
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-5 shrink-0 text-accent-400" aria-hidden />
              <span>
                {eventConfig.venue.name}
                <span className="block text-sm text-brand-200">{eventConfig.venue.address}</span>
              </span>
            </li>
          </ul>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            {registration.open ? (
              <Link href="/daftar" className={buttonClass('accent', 'lg')}>
                Daftar Sekarang
              </Link>
            ) : (
              <p className="rounded-xl bg-white/10 px-4 py-3 text-sm">
                {registration.closedMessage}
              </p>
            )}
            <Link href="/#rundown" className={buttonClass('light', 'lg')}>
              Lihat rundown
            </Link>
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 backdrop-blur sm:p-6">
          <p className="mb-4 text-center text-sm font-medium text-brand-100">Menuju hari H</p>
          <Countdown target={eventConfig.startsAt} endsAt={eventConfig.endsAt} />
        </div>
      </Container>
    </section>
  )
}
