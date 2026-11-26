import { eventConfig } from '@/config/event'
import { formatLongDate } from '@/lib/format'

// Placeholder Tahap 1. Landing page lengkap dibuat di Tahap 2.
export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-2 px-4 py-16">
      <p className="text-sm text-slate-500">{eventConfig.organizer.name} mempersembahkan</p>
      <h1 className="text-3xl font-bold">{eventConfig.name}</h1>
      <p className="text-lg">{eventConfig.tagline}</p>
      <p className="text-slate-600">
        {formatLongDate(eventConfig.startsAt)} · {eventConfig.venue.name}
      </p>
    </main>
  )
}
