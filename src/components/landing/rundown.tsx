import { eventConfig } from '@/config/event'
import { formatLongDate } from '@/lib/format'
import { Section } from '@/components/ui/section'

export function Rundown() {
  return (
    <Section
      id="rundown"
      eyebrow="Rundown"
      title="Jadwal acara"
      description={`${formatLongDate(eventConfig.startsAt)}, waktu dalam WIB.`}
    >
      <ol className="relative space-y-1 border-l-2 border-brand-100 pl-6">
        {eventConfig.rundown.map((item) => (
          <li key={item.start + item.title} className="relative py-3">
            <span
              aria-hidden
              className="absolute top-5 -left-[31px] size-3 rounded-full border-2 border-white bg-brand-500 ring-2 ring-brand-100"
            />
            <p className="font-mono text-sm text-brand-700 tabular-nums">
              {item.start} - {item.end}
            </p>
            <p className="font-medium">{item.title}</p>
            {item.description && <p className="text-sm text-slate-500">{item.description}</p>}
          </li>
        ))}
      </ol>
    </Section>
  )
}
