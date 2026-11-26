import Image from 'next/image'
import { eventConfig, type Speaker } from '@/config/event'
import { Section } from '@/components/ui/section'

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
}

function Avatar({ speaker }: { speaker: Speaker }) {
  if (speaker.photo) {
    return (
      <Image
        src={speaker.photo}
        alt={speaker.name}
        width={64}
        height={64}
        className="size-16 rounded-full object-cover"
      />
    )
  }
  return (
    <div
      aria-hidden
      className="flex size-16 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700"
    >
      {initials(speaker.name)}
    </div>
  )
}

export function Speakers() {
  return (
    <Section
      id="pembicara"
      eyebrow="Pembicara"
      title="Belajar langsung dari praktisi"
      className="bg-slate-50"
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {eventConfig.speakers.map((speaker) => (
          <li key={speaker.name} className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
            <Avatar speaker={speaker} />
            <h3 className="mt-4 font-semibold">{speaker.name}</h3>
            <p className="text-sm text-slate-500">{speaker.role}</p>
            <p className="mt-3 text-sm text-slate-700">“{speaker.topic}”</p>
          </li>
        ))}
      </ul>
    </Section>
  )
}
