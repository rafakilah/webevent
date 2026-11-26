'use client'

import { Bookmark, MessageCircle } from 'lucide-react'
import { eventConfig } from '@/config/event'
import { buttonClass } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { CopyButton } from './copy-button'

/**
 * Link halaman status adalah satu-satunya "kunci" peserta (tidak ada login).
 * Komponen ini mendorong peserta menyimpannya: salin, atau kirim ke WA sendiri.
 */
export function SaveLink({ highlight }: { highlight: boolean }) {
  const currentUrl = () => window.location.origin + window.location.pathname

  function shareToWhatsApp() {
    const text = `Link status & tiket ${eventConfig.name} saya: ${currentUrl()}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
  }

  return (
    <section
      aria-labelledby="save-link-title"
      className={cn(
        'rounded-2xl p-5 ring-1',
        highlight ? 'bg-accent-300/30 ring-accent-400' : 'bg-white ring-slate-200',
      )}
    >
      <h2 id="save-link-title" className="flex items-center gap-2 font-semibold">
        <Bookmark className="size-5 text-brand-600" aria-hidden />
        Simpan link halaman ini
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Link ini adalah akses ke status pembayaran dan tiketmu. Jangan bagikan ke orang lain.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <CopyButton getText={currentUrl} label="Salin link" />
        <button type="button" onClick={shareToWhatsApp} className={buttonClass('secondary', 'sm')}>
          <MessageCircle className="size-4" aria-hidden /> Kirim ke WhatsApp saya
        </button>
      </div>
    </section>
  )
}
