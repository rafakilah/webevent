import { CheckCircle2 } from 'lucide-react'
import { eventConfig } from '@/config/event'
import { Section } from '@/components/ui/section'

export function About() {
  return (
    <Section id="tentang" eyebrow="Tentang acara" title={`Apa itu ${eventConfig.name}?`}>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4 text-slate-700">
          {eventConfig.about.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <ul className="space-y-3">
          {eventConfig.highlights.map((item) => (
            <li key={item} className="flex gap-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <CheckCircle2 className="size-5 shrink-0 text-brand-600" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}
