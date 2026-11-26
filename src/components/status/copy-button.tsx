'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/cn'

/** Tombol salin kecil. `getText` dipanggil saat diklik (boleh membaca window). */
export function CopyButton({
  text,
  getText,
  label = 'Salin',
  className,
}: {
  text?: string
  getText?: () => string
  label?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const value = getText ? getText() : (text ?? '')
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // Fallback untuk browser lama / konteks non-HTTPS.
      const input = document.createElement('textarea')
      input.value = value
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      input.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium ring-1 transition-colors ring-inset',
        copied
          ? 'bg-green-50 text-green-700 ring-green-200'
          : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50',
        className,
      )}
    >
      {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      <span aria-live="polite">{copied ? 'Tersalin' : label}</span>
    </button>
  )
}
