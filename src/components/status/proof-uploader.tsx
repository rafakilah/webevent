'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { ImageUp, Loader2, RefreshCw } from 'lucide-react'
import { confirmProofUpload } from '@/actions/payment'
import { PAYMENT_PROOF_BUCKET } from '@/lib/env'
import { compressImage } from '@/lib/image'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { proofFileSchema } from '@/lib/validation'
import { buttonClass } from '@/components/ui/button'

type Stage = 'idle' | 'preparing' | 'uploading' | 'saving'

const STAGE_LABEL: Record<Stage, string> = {
  idle: 'Kirim bukti transfer',
  preparing: 'Menyiapkan gambar...',
  uploading: 'Mengunggah...',
  saving: 'Menyimpan...',
}

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/** Terjemahkan error Storage ke bahasa yang dimengerti peserta. */
function friendlyStorageError(message: string): string {
  if (/row-level security|unauthorized|403/i.test(message)) {
    return 'Upload ditolak. Muat ulang halaman ini; mungkin bukti sudah terkirim sebelumnya.'
  }
  if (/size|too large|413/i.test(message)) return 'Ukuran file terlalu besar (maksimal 2 MB).'
  if (/mime|type/i.test(message)) return 'Format file tidak didukung. Gunakan JPG, PNG, atau WEBP.'
  return 'Upload gagal. Periksa koneksi internet lalu coba lagi.'
}

export function ProofUploader({ token, isReupload }: { token: string; isReupload: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [isPending, startTransition] = useTransition()
  const busy = stage !== 'idle' || isPending

  // Bebaskan memori object URL preview saat diganti atau komponen dilepas.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  async function handleSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0]
    if (!selected) return
    setError(null)

    if (!selected.type.startsWith('image/')) {
      setError('File harus berupa gambar (foto atau screenshot).')
      return
    }

    setStage('preparing')
    try {
      const prepared = await compressImage(selected)
      const check = proofFileSchema.safeParse({ type: prepared.type, size: prepared.size })
      if (!check.success) {
        setError(check.error.issues[0].message)
        return
      }
      setFile(prepared)
      setPreview(URL.createObjectURL(prepared))
    } catch {
      setError('Gambar tidak bisa dibaca. Coba pilih file lain atau ambil screenshot.')
    } finally {
      setStage('idle')
    }
  }

  function handleUpload() {
    if (!file) return
    setError(null)

    startTransition(async () => {
      setStage('uploading')
      const supabase = createSupabaseBrowserClient()
      // Folder = token. Policy Storage hanya mengizinkan folder token yang valid.
      const path = `${token}/${Date.now()}.${EXTENSIONS[file.type] ?? 'jpg'}`
      const { error: uploadError } = await supabase.storage
        .from(PAYMENT_PROOF_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false })

      if (uploadError) {
        setStage('idle')
        setError(friendlyStorageError(uploadError.message))
        return
      }

      setStage('saving')
      const result = await confirmProofUpload(token, path)
      setStage('idle')
      if (!result.ok) setError(result.message)
      // Kalau sukses, action memanggil refresh() dan halaman berganti ke status baru.
    })
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleSelect}
        className="sr-only"
        id="proof-file"
        disabled={busy}
      />

      {preview ? (
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- preview lokal (blob URL) */}
          <img
            src={preview}
            alt="Pratinjau bukti transfer"
            className="max-h-80 w-full rounded-xl bg-slate-100 object-contain ring-1 ring-slate-200"
          />
          <p className="text-xs text-slate-500">
            {file?.name} · {Math.round((file?.size ?? 0) / 1024)} KB
          </p>
          <label
            htmlFor="proof-file"
            className={buttonClass('ghost', 'sm', busy ? 'pointer-events-none opacity-60' : '')}
          >
            <RefreshCw className="size-4" aria-hidden /> Ganti gambar
          </label>
        </div>
      ) : (
        <label
          htmlFor="proof-file"
          className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 p-8 text-center transition-colors hover:border-brand-400 hover:bg-brand-50"
        >
          {stage === 'preparing' ? (
            <Loader2 className="size-8 animate-spin text-brand-600" aria-hidden />
          ) : (
            <ImageUp className="size-8 text-brand-600" aria-hidden />
          )}
          <span className="font-medium">
            {stage === 'preparing' ? 'Menyiapkan gambar...' : 'Pilih foto / screenshot bukti'}
          </span>
          <span className="text-sm text-slate-500">
            JPG, PNG, atau WEBP. Foto besar dikecilkan otomatis.
          </span>
        </label>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200"
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || busy}
        className={buttonClass('primary', 'lg', 'w-full')}
      >
        {busy && stage !== 'preparing' && <Loader2 className="size-5 animate-spin" aria-hidden />}
        {stage === 'idle' && isReupload ? 'Kirim ulang bukti transfer' : STAGE_LABEL[stage]}
      </button>
    </div>
  )
}
