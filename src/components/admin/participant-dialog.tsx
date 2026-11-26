'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import {
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  ImageIcon,
  Loader2,
  MessageCircle,
  Undo2,
  X,
  XCircle,
} from 'lucide-react'
import { getProofUrl, undoCheckIn, verifyPayment } from '@/actions/admin'
import { eventConfig } from '@/config/event'
import { formatDateTime, formatPhone, whatsappLink } from '@/lib/format'
import type { AdminParticipant } from '@/types/admin'
import { CopyButton } from '@/components/status/copy-button'
import { StatusBadge } from '@/components/status/status-badge'
import { buttonClass } from '@/components/ui/button'

const QUICK_REASONS = [
  'Nominal transfer tidak sesuai.',
  'Gambar buram, nama pengirim atau nominal tidak terbaca.',
  'Bukan bukti transfer ke rekening panitia.',
]

type ProofState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; url: string }
  | { status: 'error'; message: string }

/**
 * Detail peserta memakai <dialog> bawaan browser: fokus otomatis terkunci di
 * dalam dialog, tombol Esc menutup, dan latar belakang tidak bisa diklik.
 */
export function ParticipantDialog({
  participant: p,
  nextWaiting,
  onNext,
  onClose,
}: {
  participant: AdminParticipant
  nextWaiting: AdminParticipant | null
  onNext: (id: string) => void
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  // Bukti langsung dimuat kalau peserta sedang menunggu verifikasi.
  const autoLoadProof = p.payment_status === 'menunggu_verifikasi' && Boolean(p.payment_proof_path)
  const [proof, setProof] = useState<ProofState>(
    autoLoadProof ? { status: 'loading' } : { status: 'idle' },
  )
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [confirmUndo, setConfirmUndo] = useState(false)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])

  function fetchProof() {
    getProofUrl(p.id).then((result) =>
      setProof(
        result.ok
          ? { status: 'ready', url: result.data }
          : { status: 'error', message: result.message },
      ),
    )
  }

  function loadProof() {
    setProof({ status: 'loading' })
    fetchProof()
  }

  useEffect(() => {
    if (autoLoadProof) fetchProof()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cukup sekali saat dialog dibuka
  }, [])

  function runAction(action: () => Promise<{ ok: boolean; message?: string }>, success: string) {
    setMessage(null)
    startTransition(async () => {
      const result = await action()
      // Update state setelah await dibungkus startTransition lagi, supaya pesan
      // muncul BERSAMAAN dengan data baru hasil refresh() (bukan sedetik lebih awal).
      startTransition(() => {
        if (result.ok) {
          setMessage({ tone: 'ok', text: success })
          setRejecting(false)
          setConfirmUndo(false)
        } else {
          setMessage({ tone: 'error', text: result.message ?? 'Terjadi kesalahan.' })
        }
      })
    })
  }

  const statusUrl = () => `${window.location.origin}/status/${p.token}`
  const waText = () =>
    `Halo ${p.full_name}, ini panitia ${eventConfig.name}. Link status & tiket kamu: ${statusUrl()}`

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="participant-title"
      className="m-auto w-full max-w-lg rounded-2xl bg-white p-0 shadow-xl backdrop:bg-slate-900/50 max-sm:mb-0 max-sm:max-w-none max-sm:rounded-b-none"
    >
      <div className="flex max-h-[90dvh] flex-col">
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 p-5">
          <div className="min-w-0">
            <h2 id="participant-title" className="truncate text-lg font-bold">
              {p.full_name}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <StatusBadge status={p.payment_status} />
              {p.checked_in_at && (
                <span className="text-xs font-medium text-green-700">
                  ✓ Check-in {formatDateTime(p.checked_in_at)}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Tutup"
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>

        <div className="space-y-5 overflow-y-auto p-5">
          {message && (
            <p
              role="status"
              className={
                message.tone === 'ok'
                  ? 'rounded-xl bg-green-50 p-3 text-sm text-green-800 ring-1 ring-green-200'
                  : 'rounded-xl bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200'
              }
            >
              {message.text}
            </p>
          )}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Info label="NIM" value={p.nim} />
            <Info label="Jurusan" value={p.major} />
            <Info label="Email" value={p.email} wide />
            <Info label="WhatsApp" value={formatPhone(p.phone)} />
            <Info label="Daftar" value={formatDateTime(p.created_at)} />
            {p.proof_uploaded_at && (
              <Info label="Bukti dikirim" value={formatDateTime(p.proof_uploaded_at)} />
            )}
            {p.verified_at && <Info label="Diverifikasi" value={formatDateTime(p.verified_at)} />}
            {p.rejection_reason && <Info label="Alasan ditolak" value={p.rejection_reason} wide />}
          </dl>

          {p.payment_proof_path && (
            <section>
              <h3 className="mb-2 text-sm font-semibold">Bukti transfer</h3>
              {proof.status === 'idle' && (
                <button
                  type="button"
                  onClick={loadProof}
                  className={buttonClass('secondary', 'sm')}
                >
                  <ImageIcon className="size-4" aria-hidden /> Lihat bukti transfer
                </button>
              )}
              {proof.status === 'loading' && (
                <div className="flex h-48 items-center justify-center rounded-xl bg-slate-100">
                  <Loader2
                    className="size-6 animate-spin text-slate-400"
                    aria-label="Memuat bukti"
                  />
                </div>
              )}
              {proof.status === 'error' && <p className="text-sm text-red-700">{proof.message}</p>}
              {proof.status === 'ready' && (
                <div className="space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- signed URL sementara */}
                  <img
                    src={proof.url}
                    alt={`Bukti transfer ${p.full_name}`}
                    className="max-h-96 w-full rounded-xl bg-slate-100 object-contain ring-1 ring-slate-200"
                  />
                  <a
                    href={proof.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
                  >
                    Buka ukuran penuh <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                  <p className="text-xs text-slate-500">Link berlaku 5 menit.</p>
                </div>
              )}
            </section>
          )}

          {p.payment_status === 'menunggu_verifikasi' && (
            <section className="space-y-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <h3 className="text-sm font-semibold">Verifikasi pembayaran</h3>
              {!rejecting ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      runAction(
                        () => verifyPayment(p.id, true),
                        'Pembayaran diterima. Tiket peserta sudah aktif.',
                      )
                    }
                    className={buttonClass('primary', 'md', 'bg-green-600 hover:bg-green-700')}
                  >
                    {isPending ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <CheckCircle2 className="size-4" aria-hidden />
                    )}
                    Terima
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setRejecting(true)}
                    className={buttonClass('secondary', 'md', 'text-red-700')}
                  >
                    <XCircle className="size-4" aria-hidden /> Tolak
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <label htmlFor="reject-reason" className="block text-sm text-slate-700">
                    Alasan penolakan (dilihat peserta)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_REASONS.map((quick) => (
                      <button
                        key={quick}
                        type="button"
                        onClick={() => setReason(quick)}
                        className="rounded-full bg-white px-3 py-1 text-xs ring-1 ring-slate-300 hover:bg-slate-100"
                      >
                        {quick}
                      </button>
                    ))}
                  </div>
                  <textarea
                    id="reject-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    maxLength={300}
                    className="block w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                    placeholder="Contoh: nominal transfer Rp40.000, kurang Rp10.000."
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRejecting(false)}
                      className={buttonClass('ghost')}
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        runAction(
                          () => verifyPayment(p.id, false, reason),
                          'Pembayaran ditolak. Peserta bisa mengunggah ulang.',
                        )
                      }
                      className={buttonClass('danger')}
                    >
                      {isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                      Tolak pembayaran
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {p.checked_in_at && (
            <section className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <h3 className="text-sm font-semibold">Check-in</h3>
              <p className="mt-1 text-sm text-slate-600">
                Tercatat {formatDateTime(p.checked_in_at)} WIB. Batalkan hanya jika salah scan.
              </p>
              {!confirmUndo ? (
                <button
                  type="button"
                  onClick={() => setConfirmUndo(true)}
                  className={buttonClass('secondary', 'sm', 'mt-3')}
                >
                  <Undo2 className="size-4" aria-hidden /> Batalkan check-in
                </button>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => runAction(() => undoCheckIn(p.id), 'Check-in dibatalkan.')}
                    className={buttonClass('danger', 'sm')}
                  >
                    {isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                    Ya, batalkan
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmUndo(false)}
                    className={buttonClass('ghost', 'sm')}
                  >
                    Tidak
                  </button>
                </div>
              )}
            </section>
          )}

          <section className="flex flex-wrap gap-2">
            <CopyButton getText={statusUrl} label="Salin link status" />
            <button
              type="button"
              onClick={() => window.open(whatsappLink(p.phone, waText()), '_blank', 'noopener')}
              className={buttonClass('secondary', 'sm')}
            >
              <MessageCircle className="size-4" aria-hidden /> Chat WhatsApp
            </button>
          </section>
        </div>

        {nextWaiting && p.payment_status !== 'menunggu_verifikasi' && (
          <footer className="border-t border-slate-200 p-4">
            <button
              type="button"
              onClick={() => onNext(nextWaiting.id)}
              className={buttonClass('primary', 'md', 'w-full')}
            >
              Verifikasi berikutnya: {nextWaiting.full_name}{' '}
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </footer>
        )}
      </div>
    </dialog>
  )
}

function Info({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? 'col-span-2' : undefined}>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium break-words">{value}</dd>
    </div>
  )
}
