import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { eventConfig } from '@/config/event'
import { formatDateTime } from '@/lib/format'
import { getParticipantByToken } from '@/lib/participant'
import { AutoRefresh } from '@/components/status/auto-refresh'
import { PaymentInstructions } from '@/components/status/payment-instructions'
import { ProgressSteps } from '@/components/status/progress-steps'
import { ProofUploader } from '@/components/status/proof-uploader'
import { SaveLink } from '@/components/status/save-link'
import { StatusBadge } from '@/components/status/status-badge'
import { TicketCard } from '@/components/status/ticket-card'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { Container } from '@/components/ui/section'

export const metadata: Metadata = {
  title: 'Status pendaftaran',
  // Halaman pribadi: jangan diindeks mesin pencari, dan jangan kirim URL (yang
  // berisi token) sebagai Referer saat peserta membuka link ke situs lain.
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

/*
 * Shell halaman (header, footer, kerangka loading) dirender statis. Data
 * peserta bergantung pada token di URL, jadi dimuat saat request di dalam
 * <Suspense> dan di-stream begitu siap.
 */
export default function StatusPage({ params, searchParams }: PageProps<'/status/[token]'>) {
  return (
    <>
      <SiteHeader showCta={false} />
      <main className="flex-1 bg-slate-50 py-6 sm:py-10">
        <Container className="max-w-xl">
          <Suspense fallback={<StatusSkeleton />}>
            <StatusContent params={params} searchParams={searchParams} />
          </Suspense>
        </Container>
      </main>
      <SiteFooter />
    </>
  )
}

async function StatusContent({
  params,
  searchParams,
}: Pick<PageProps<'/status/[token]'>, 'params' | 'searchParams'>) {
  const { token } = await params
  const { baru } = await searchParams
  const participant = await getParticipantByToken(token)
  if (!participant) notFound()

  const status = participant.payment_status
  const justRegistered = baru === '1'

  return (
    <div className="space-y-5">
      {justRegistered && status === 'menunggu_pembayaran' && (
        <div className="flex gap-3 rounded-2xl bg-green-50 p-4 text-green-900 ring-1 ring-green-200">
          <CheckCircle2 className="size-6 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">Pendaftaran berhasil!</p>
            <p className="text-sm">Langkah berikutnya: transfer, lalu unggah bukti di bawah.</p>
          </div>
        </div>
      )}

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-slate-500">{eventConfig.name}</p>
            <h1 className="truncate text-xl font-bold">{participant.full_name}</h1>
            <p className="text-sm text-slate-600">
              {participant.nim} · {participant.major}
            </p>
          </div>
          <StatusBadge status={status} className="shrink-0" />
        </div>
        <div className="mt-5">
          <ProgressSteps status={status} />
        </div>
      </section>

      {status === 'lunas' && <TicketCard token={token} participant={participant} />}

      {status === 'menunggu_verifikasi' && (
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <AutoRefresh />
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Clock className="size-5 text-sky-600" aria-hidden />
            Bukti transfer sedang diperiksa
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Dikirim {participant.proof_uploaded_at && formatDateTime(participant.proof_uploaded_at)}{' '}
            WIB. Panitia memverifikasi maksimal 1x24 jam. Halaman ini diperbarui otomatis dan tiket
            QR akan muncul di sini begitu pembayaran diterima.
          </p>
        </section>
      )}

      {(status === 'menunggu_pembayaran' || status === 'ditolak') && (
        <section className="space-y-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          {status === 'ditolak' && (
            <div className="flex gap-3 rounded-xl bg-red-50 p-4 text-red-900 ring-1 ring-red-200">
              <XCircle className="size-5 shrink-0" aria-hidden />
              <div className="text-sm">
                <p className="font-semibold">Bukti transfer ditolak</p>
                <p>Alasan: {participant.rejection_reason}</p>
                <p className="mt-1">Perbaiki sesuai alasan di atas, lalu unggah ulang buktinya.</p>
              </div>
            </div>
          )}
          <div>
            <h2 className="text-lg font-semibold">1. Transfer ke rekening panitia</h2>
            <div className="mt-3">
              <PaymentInstructions registeredAt={participant.created_at} />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold">2. Unggah bukti transfer</h2>
            <div className="mt-3">
              <ProofUploader token={token} isReupload={status === 'ditolak'} />
            </div>
          </div>
        </section>
      )}

      <SaveLink highlight={justRegistered} />
    </div>
  )
}

function StatusSkeleton() {
  return (
    <div className="animate-pulse space-y-5" aria-label="Memuat status pendaftaran">
      <div className="h-36 rounded-2xl bg-white ring-1 ring-slate-200" />
      <div className="h-80 rounded-2xl bg-white ring-1 ring-slate-200" />
    </div>
  )
}
