import { Check } from 'lucide-react'
import type { PaymentStatus } from '@/types/database'
import { cn } from '@/lib/cn'

const STEPS = ['Daftar', 'Bayar', 'Verifikasi', 'Tiket']

function currentStep(status: PaymentStatus): number {
  switch (status) {
    case 'menunggu_pembayaran':
    case 'ditolak':
      return 1
    case 'menunggu_verifikasi':
      return 2
    case 'lunas':
      return 4 // semua langkah selesai
  }
}

/** Penanda posisi peserta di alur: Daftar > Bayar > Verifikasi > Tiket. */
export function ProgressSteps({ status }: { status: PaymentStatus }) {
  const current = currentStep(status)

  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Tahapan pendaftaran">
      {STEPS.map((label, index) => {
        const done = index < current
        const active = index === current
        return (
          <li key={label} className="flex flex-col items-center gap-1.5 text-center">
            <span
              className={cn(
                'flex size-8 items-center justify-center rounded-full text-sm font-bold',
                done && 'bg-brand-600 text-white',
                active && 'bg-white text-brand-700 ring-2 ring-brand-600',
                !done && !active && 'bg-slate-100 text-slate-400',
              )}
              aria-current={active ? 'step' : undefined}
            >
              {done ? <Check className="size-4" aria-hidden /> : index + 1}
            </span>
            <span className={cn('text-xs', done || active ? 'text-slate-900' : 'text-slate-400')}>
              {label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
