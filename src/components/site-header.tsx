import Link from 'next/link'
import { eventConfig } from '@/config/event'
import { buttonClass } from '@/components/ui/button'
import { Container } from '@/components/ui/section'

const NAV = [
  { href: '/#tentang', label: 'Tentang' },
  { href: '/#pembicara', label: 'Pembicara' },
  { href: '/#rundown', label: 'Rundown' },
  { href: '/#tiket', label: 'Tiket' },
  { href: '/#faq', label: 'FAQ' },
]

export function SiteHeader({ showCta = true }: { showCta?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="font-bold tracking-tight">
          {eventConfig.name}
        </Link>
        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={buttonClass('ghost', 'sm')}>
              {item.label}
            </Link>
          ))}
        </nav>
        {showCta && eventConfig.registration.open && (
          <Link href="/daftar" className={buttonClass('primary', 'sm')}>
            Daftar
          </Link>
        )}
      </Container>
    </header>
  )
}
