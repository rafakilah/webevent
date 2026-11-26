import type { PaymentStatus } from '@/types/database'
import { cn } from '@/lib/cn'

export const STATUS_LABEL: Record<PaymentStatus, string> = {
  menunggu_pembayaran: 'Menunggu pembayaran',
  menunggu_verifikasi: 'Menunggu verifikasi',
  lunas: 'Lunas',
  ditolak: 'Ditolak',
}

const STYLES: Record<PaymentStatus, string> = {
  menunggu_pembayaran: 'bg-amber-50 text-amber-800 ring-amber-200',
  menunggu_verifikasi: 'bg-sky-50 text-sky-800 ring-sky-200',
  lunas: 'bg-green-50 text-green-800 ring-green-200',
  ditolak: 'bg-red-50 text-red-800 ring-red-200',
}

export function StatusBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        STYLES[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}
