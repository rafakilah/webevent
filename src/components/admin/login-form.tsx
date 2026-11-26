'use client'

import { useActionState } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { signIn, type SignInState } from '@/actions/auth'
import { buttonClass } from '@/components/ui/button'

const initialState: SignInState = {}
const inputClass =
  'mt-1.5 block h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100'

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(signIn, initialState)

  return (
    <form action={formAction} className="space-y-4">
      {state.message && !pending && (
        <p
          role="alert"
          className="flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200"
        >
          <AlertCircle className="size-5 shrink-0" aria-hidden />
          {state.message}
        </p>
      )}
      <input type="hidden" name="next" value={next ?? ''} />
      <div>
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state.email}
          key={state.email}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>
      <button type="submit" disabled={pending} className={buttonClass('primary', 'lg', 'w-full')}>
        {pending && <Loader2 className="size-5 animate-spin" aria-hidden />}
        Masuk
      </button>
    </form>
  )
}
