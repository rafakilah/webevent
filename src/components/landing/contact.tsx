import { AtSign, Mail, MessageCircle } from 'lucide-react'
import { eventConfig } from '@/config/event'
import { formatPhone, whatsappLink } from '@/lib/format'
import { Section } from '@/components/ui/section'

export function Contact() {
  const { contacts, organizer } = eventConfig

  return (
    <Section
      id="kontak"
      eyebrow="Kontak"
      title="Ada pertanyaan?"
      description="Hubungi panitia lewat WhatsApp. Kami biasanya membalas dalam beberapa jam."
      className="bg-slate-50"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {contacts.map((contact) => (
          <a
            key={contact.whatsapp}
            href={whatsappLink(
              contact.whatsapp,
              `Halo kak ${contact.name}, saya mau tanya soal ${eventConfig.name}.`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200 transition hover:ring-brand-400"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-green-100 text-green-700">
              <MessageCircle className="size-5" aria-hidden />
            </span>
            <span>
              <span className="block font-semibold">{contact.name}</span>
              <span className="block text-sm text-slate-500">{contact.role}</span>
              <span className="block text-sm text-slate-700">{formatPhone(contact.whatsapp)}</span>
            </span>
          </a>
        ))}
        <div className="space-y-3 rounded-2xl bg-white p-5 text-sm ring-1 ring-slate-200">
          <p className="font-semibold">{organizer.name}</p>
          {organizer.instagram && (
            <p className="flex items-center gap-2 text-slate-700">
              <AtSign className="size-4" aria-hidden /> {organizer.instagram}
            </p>
          )}
          {organizer.email && (
            <a
              href={`mailto:${organizer.email}`}
              className="flex items-center gap-2 text-slate-700 hover:text-brand-700"
            >
              <Mail className="size-4" aria-hidden /> {organizer.email}
            </a>
          )}
        </div>
      </div>
    </Section>
  )
}
