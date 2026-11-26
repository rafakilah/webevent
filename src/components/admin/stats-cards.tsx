import { Banknote, Clock, ScanLine, Ticket, TrendingUp, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { eventConfig } from '@/config/event'
import { formatRupiah } from '@/lib/format'
import type { DashboardStats } from '@/types/admin'
import { cn } from '@/lib/cn'

type Card = { label: string; value: string; hint?: string; icon: LucideIcon; tone?: string }

export function StatsCards({ stats }: { stats: DashboardStats }) {
  // Kehadiran dihitung dari peserta lunas (yang memang punya tiket).
  const attendance = stats.lunas > 0 ? Math.round((stats.checked_in / stats.lunas) * 100) : 0

  const cards: Card[] = [
    { label: 'Total pendaftar', value: String(stats.total), icon: Users },
    {
      label: 'Menunggu verifikasi',
      value: String(stats.menunggu_verifikasi),
      hint: stats.menunggu_verifikasi > 0 ? 'Perlu dicek' : 'Semua beres',
      icon: Clock,
      tone: stats.menunggu_verifikasi > 0 ? 'text-sky-700' : undefined,
    },
    {
      label: 'Lunas',
      value: String(stats.lunas),
      hint: `${stats.menunggu_pembayaran} belum bayar · ${stats.ditolak} ditolak`,
      icon: Ticket,
    },
    { label: 'Sudah check-in', value: String(stats.checked_in), icon: ScanLine },
    {
      label: 'Kehadiran',
      value: `${attendance}%`,
      hint: `${stats.checked_in} dari ${stats.lunas} pemegang tiket`,
      icon: TrendingUp,
    },
    {
      label: 'Total pemasukan',
      value: formatRupiah(stats.lunas * eventConfig.ticket.price),
      hint: `${stats.lunas} × ${formatRupiah(eventConfig.ticket.price)}`,
      icon: Banknote,
    },
  ]

  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-6">
      {cards.map(({ label, value, hint, icon: Icon, tone }) => (
        <li key={label} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Icon className="size-4" aria-hidden />
            {label}
          </p>
          <p className={cn('mt-2 text-2xl font-bold tracking-tight tabular-nums', tone)}>{value}</p>
          {hint && <p className="mt-0.5 truncate text-xs text-slate-500">{hint}</p>}
        </li>
      ))}
    </ul>
  )
}
