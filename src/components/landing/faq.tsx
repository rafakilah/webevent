import { ChevronDown } from 'lucide-react'
import { eventConfig } from '@/config/event'
import { Section } from '@/components/ui/section'

/*
 * Accordion memakai elemen bawaan <details>/<summary>: bisa dibuka-tutup tanpa
 * JavaScript, otomatis bisa diakses keyboard dan screen reader.
 */
export function Faq() {
  return (
    <Section id="faq" eyebrow="FAQ" title="Pertanyaan yang sering ditanyakan">
      <div className="divide-y divide-slate-200 rounded-2xl ring-1 ring-slate-200">
        {eventConfig.faq.map((item) => (
          <details
            key={item.question}
            className="group px-5 [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium">
              {item.question}
              <ChevronDown
                className="size-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <p className="pb-5 text-slate-600">{item.answer}</p>
          </details>
        ))}
      </div>
    </Section>
  )
}
