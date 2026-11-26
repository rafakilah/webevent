import { eventConfig } from '@/config/event'
import { Container } from '@/components/ui/section'

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50 py-8 text-sm text-slate-500">
      <Container className="flex flex-col gap-1 sm:flex-row sm:justify-between">
        <p>
          {eventConfig.name} · Diselenggarakan oleh {eventConfig.organizer.name}
        </p>
        <p>Event fiktif untuk keperluan portfolio.</p>
      </Container>
    </footer>
  )
}
