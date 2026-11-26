import { AlertTriangle, CheckCircle2, Loader2, WifiOff, XCircle } from 'lucide-react'
import type { CheckInOutcome } from '@/lib/checkin'
import { formatTime } from '@/lib/format'
import { cn } from '@/lib/cn'

export type ScanResult =
  | { state: 'pending'; label: string }
  | { state: 'done'; outcome: CheckInOutcome; scannedAt: number }

const VIEW = {
  berhasil: { tone: 'bg-green-600 text-white', icon: CheckCircle2, title: 'Berhasil check-in' },
  sudah: {
    tone: 'bg-amber-400 text-amber-950',
    icon: AlertTriangle,
    title: 'Sudah check-in sebelumnya',
  },
  belum_lunas: { tone: 'bg-red-600 text-white', icon: XCircle, title: 'Belum lunas' },
  tidak_valid: { tone: 'bg-red-600 text-white', icon: XCircle, title: 'Tiket tidak valid' },
  bukan_tiket: { tone: 'bg-red-600 text-white', icon: XCircle, title: 'Tiket tidak valid' },
  gagal_jaringan: { tone: 'bg-slate-700 text-white', icon: WifiOff, title: 'Gagal terhubung' },
} as const

/** Hasil scan dibuat besar dan berwarna supaya terbaca sekilas di antrean ramai. */
export function ResultCard({ result }: { result: ScanResult | null }) {
  if (!result) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-300 p-6 text-center text-slate-500">
        Arahkan kamera ke QR tiket peserta.
      </div>
    )
  }

  if (result.state === 'pending') {
    return (
      <div className="flex items-center gap-4 rounded-2xl bg-slate-200 p-6" role="status">
        <Loader2 className="size-10 animate-spin text-slate-600" aria-hidden />
        <p className="text-xl font-bold text-slate-700">{result.label}</p>
      </div>
    )
  }

  const { outcome } = result
  const view = VIEW[outcome.kind]
  const Icon = view.icon

  return (
    <div className={cn('rounded-2xl p-6', view.tone)} role="status" aria-live="assertive">
      <div className="flex items-center gap-3">
        <Icon className="size-10 shrink-0" aria-hidden />
        <p className="text-2xl leading-tight font-extrabold">{view.title}</p>
      </div>

      {'fullName' in outcome && outcome.fullName && (
        <div className="mt-4">
          <p className="text-3xl leading-tight font-bold break-words">{outcome.fullName}</p>
          <p className="mt-1 text-lg opacity-90">
            {outcome.nim} · {outcome.major}
          </p>
        </div>
      )}

      <p className="mt-3 text-lg font-medium">
        {outcome.kind === 'berhasil' &&
          outcome.checkedInAt &&
          `Pukul ${formatTime(outcome.checkedInAt)} WIB`}
        {outcome.kind === 'sudah' &&
          outcome.checkedInAt &&
          `Check-in pertama pukul ${formatTime(outcome.checkedInAt)} WIB`}
        {outcome.kind === 'belum_lunas' &&
          'Arahkan peserta ke meja pembayaran / hubungi bendahara.'}
        {outcome.kind === 'tidak_valid' &&
          'QR tidak terdaftar. Cek nama peserta lewat check-in manual.'}
        {outcome.kind === 'bukan_tiket' &&
          'QR ini bukan tiket event. Minta peserta membuka tiket yang benar.'}
        {outcome.kind === 'gagal_jaringan' && outcome.message}
      </p>
    </div>
  )
}
