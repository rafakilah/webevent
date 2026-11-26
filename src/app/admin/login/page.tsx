import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LockKeyhole } from 'lucide-react'
import { eventConfig } from '@/config/event'
import { LoginForm } from '@/components/admin/login-form'

export const metadata: Metadata = {
  title: 'Login panitia',
  robots: { index: false, follow: false },
}

export default function AdminLoginPage({ searchParams }: PageProps<'/admin/login'>) {
  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <div className="mb-6 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <LockKeyhole className="size-6" aria-hidden />
          </span>
          <h1 className="mt-3 text-xl font-bold">Dashboard panitia</h1>
          <p className="text-sm text-slate-500">{eventConfig.name}</p>
        </div>
        <Suspense fallback={<LoginForm />}>
          {searchParams.then(({ next }) => (
            <LoginForm next={typeof next === 'string' ? next : undefined} />
          ))}
        </Suspense>
      </div>
    </main>
  )
}
