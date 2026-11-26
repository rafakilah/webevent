'use client'

import { startTransition, useActionState, useState, type ChangeEvent, type FormEvent } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { registerParticipant, type RegistrationState } from '@/actions/registration'
import { eventConfig } from '@/config/event'
import {
  registrationSchema,
  type RegistrationField,
  type RegistrationInput,
} from '@/lib/validation'
import { buttonClass } from '@/components/ui/button'
import { cn } from '@/lib/cn'

type FieldConfig = {
  name: RegistrationField
  label: string
  placeholder: string
  hint?: string
  type?: string
  inputMode?: 'text' | 'numeric' | 'tel' | 'email'
  autoComplete?: string
  list?: string
}

const FIELDS: FieldConfig[] = [
  { name: 'fullName', label: 'Nama lengkap', placeholder: 'Sesuai KTM', autoComplete: 'name' },
  {
    name: 'nim',
    label: 'NIM',
    placeholder: '1202230045',
    hint: eventConfig.registration.nimHint,
    inputMode: 'numeric',
    autoComplete: 'off',
  },
  {
    name: 'email',
    label: 'Email',
    placeholder: 'nama@student.kampus.ac.id',
    type: 'email',
    inputMode: 'email',
    autoComplete: 'email',
  },
  {
    name: 'phone',
    label: 'Nomor WhatsApp',
    placeholder: '0812-3456-7890',
    hint: 'Dipakai panitia untuk menghubungi kamu',
    type: 'tel',
    inputMode: 'tel',
    autoComplete: 'tel',
  },
  {
    name: 'major',
    label: 'Fakultas / jurusan',
    placeholder: 'Pilih atau ketik jurusanmu',
    list: 'major-suggestions',
    autoComplete: 'off',
  },
]

const EMPTY: RegistrationInput = { fullName: '', nim: '', email: '', phone: '', major: '' }
const initialState: RegistrationState = {}

/** Validasi satu field dengan skema yang sama persis dengan server. */
function validateField(name: RegistrationField, value: string): string | undefined {
  const result = registrationSchema.shape[name].safeParse(value)
  return result.success ? undefined : result.error.issues[0]?.message
}

export function RegistrationForm() {
  const [state, formAction, pending] = useActionState(registerParticipant, initialState)

  // Nilai input disimpan di state agar bisa divalidasi sambil mengetik.
  const [values, setValues] = useState<RegistrationInput>(EMPTY)
  const [clientErrors, setClientErrors] = useState<Partial<Record<RegistrationField, string>>>({})
  // Error dari server (misal "NIM sudah terdaftar") disembunyikan begitu field diubah.
  const [dismissed, setDismissed] = useState<Set<RegistrationField>>(new Set())
  const [consent, setConsent] = useState(false)
  const [consentError, setConsentError] = useState(false)

  function errorFor(name: RegistrationField) {
    return clientErrors[name] ?? (dismissed.has(name) ? undefined : state.fieldErrors?.[name])
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const name = event.target.name as RegistrationField
    setValues((prev) => ({ ...prev, [name]: event.target.value }))
    setDismissed((prev) => new Set(prev).add(name))
    // Kalau field sedang error, validasi ulang sambil mengetik agar error hilang secepatnya.
    if (clientErrors[name]) {
      setClientErrors((prev) => ({ ...prev, [name]: validateField(name, event.target.value) }))
    }
  }

  function handleBlur(event: ChangeEvent<HTMLInputElement>) {
    const name = event.target.name as RegistrationField
    if (!event.target.value) return // jangan memarahi field yang belum disentuh
    setClientErrors((prev) => ({ ...prev, [name]: validateField(name, event.target.value) }))
  }

  /*
   * Dengan JavaScript: validasi dulu di browser, lalu panggil action manual di
   * dalam startTransition. Cara ini mencegah React mereset form setelah action
   * selesai, jadi isian dan centang persetujuan tidak hilang kalau server
   * mengembalikan error (misal NIM sudah terdaftar).
   * Tanpa JavaScript: atribut action tetap membuat form terkirim biasa ke server.
   */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors: Partial<Record<RegistrationField, string>> = {}
    for (const field of FIELDS) {
      const message = validateField(field.name, values[field.name])
      if (message) errors[field.name] = message
    }
    setClientErrors(errors)
    setConsentError(!consent)
    if (Object.keys(errors).length > 0 || !consent) {
      const first = FIELDS.find((field) => errors[field.name])
      document.getElementById(first ? first.name : 'consent')?.focus()
      return
    }
    setDismissed(new Set())
    const formData = new FormData(event.currentTarget)
    startTransition(() => formAction(formData))
  }

  const generalMessage = state.message && !pending ? state.message : undefined

  return (
    <form action={formAction} onSubmit={handleSubmit} noValidate className="space-y-5">
      {generalMessage && (
        <div
          role="alert"
          className="flex gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200"
        >
          <AlertCircle className="size-5 shrink-0" aria-hidden />
          {generalMessage}
        </div>
      )}

      {FIELDS.map((field) => {
        const error = errorFor(field.name)
        const describedBy = [error && `${field.name}-error`, field.hint && `${field.name}-hint`]
          .filter(Boolean)
          .join(' ')
        return (
          <div key={field.name}>
            <label htmlFor={field.name} className="block text-sm font-medium text-slate-800">
              {field.label}
            </label>
            <input
              id={field.name}
              name={field.name}
              type={field.type ?? 'text'}
              inputMode={field.inputMode}
              autoComplete={field.autoComplete}
              list={field.list}
              placeholder={field.placeholder}
              value={values[field.name]}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy || undefined}
              className={cn(
                'mt-1.5 block h-12 w-full rounded-xl border bg-white px-4 text-base shadow-xs outline-none',
                'placeholder:text-slate-400 focus:ring-4',
                error
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                  : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100',
              )}
            />
            {error ? (
              <p id={`${field.name}-error`} className="mt-1.5 text-sm text-red-700">
                {error}
              </p>
            ) : (
              field.hint && (
                <p id={`${field.name}-hint`} className="mt-1.5 text-sm text-slate-500">
                  {field.hint}
                </p>
              )
            )}
          </div>
        )
      })}

      <datalist id="major-suggestions">
        {eventConfig.registration.majorSuggestions.map((major) => (
          <option key={major} value={major} />
        ))}
      </datalist>

      {/* Honeypot anti-bot: disembunyikan dari manusia dan screen reader. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label
          className={cn(
            'flex gap-3 rounded-xl p-4 text-sm text-slate-700 ring-1',
            consentError ? 'bg-red-50 ring-red-300' : 'bg-slate-50 ring-slate-200',
          )}
        >
          <input
            id="consent"
            type="checkbox"
            name="consent"
            checked={consent}
            onChange={(event) => {
              setConsent(event.target.checked)
              if (event.target.checked) setConsentError(false)
            }}
            required
            aria-invalid={consentError || undefined}
            aria-describedby={consentError ? 'consent-error' : undefined}
            className="mt-0.5 size-4 shrink-0 accent-brand-600"
          />
          <span>
            Saya setuju data di atas digunakan panitia hanya untuk keperluan {eventConfig.name}{' '}
            (verifikasi pembayaran, check-in, dan sertifikat).
          </span>
        </label>
        {consentError && (
          <p id="consent-error" className="mt-1.5 text-sm text-red-700">
            Centang persetujuan untuk melanjutkan.
          </p>
        )}
      </div>

      <button type="submit" disabled={pending} className={buttonClass('primary', 'lg', 'w-full')}>
        {pending ? (
          <>
            <Loader2 className="size-5 animate-spin" aria-hidden /> Mendaftarkan...
          </>
        ) : (
          'Daftar'
        )}
      </button>
    </form>
  )
}
