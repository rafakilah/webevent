import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { About } from '@/components/landing/about'
import { Contact } from '@/components/landing/contact'
import { Faq } from '@/components/landing/faq'
import { Hero } from '@/components/landing/hero'
import { Rundown } from '@/components/landing/rundown'
import { Speakers } from '@/components/landing/speakers'
import { Ticket } from '@/components/landing/ticket'

/*
 * Landing page sepenuhnya statis: semua konten berasal dari config, jadi
 * Next.js merendernya menjadi HTML saat build dan disajikan langsung dari CDN.
 * Satu-satunya bagian interaktif adalah countdown (komponen client).
 */
export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <About />
        <Speakers />
        <Rundown />
        <Ticket />
        <Faq />
        <Contact />
      </main>
      <SiteFooter />
    </>
  )
}
