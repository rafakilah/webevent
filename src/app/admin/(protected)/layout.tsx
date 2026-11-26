import type { Metadata } from 'next'
import { Suspense, type ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'
import { signOut } from '@/actions/auth'
import { getAdminSession } from '@/lib/auth'
import { AdminNav } from '@/components/admin/admin-nav'
import { buttonClass } from '@/components/ui/button'

export const metadata: Metadata = {
  title: { default: 'Dashboard panitia', template: '%s | Panitia' },
  robots: { index: false, follow: false },
}

/*
 * Navigasi dirender statis. Pengecekan sesi membaca cookie (data per-request),
 * jadi diletakkan di dalam <Suspense> agar kerangka halaman tetap tampil instan.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50">
      <AdminNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Suspense fallback={<AdminSkeleton />}>
          <RequireAdmin>{children}</RequireAdmin>
        </Suspense>
      </main>
    </div>
  )
}

async function RequireAdmin({ children }: { children: ReactNode }) {
  const session = await getAdminSession()
  if (session.status === 'anonymous') redirect('/admin/login')
  if (session.status === 'not_admin') {
    return (
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200">
        <ShieldAlert className="mx-auto size-10 text-amber-500" aria-hidden />
        <h1 className="mt-3 text-lg font-bold">Bukan akun panitia</h1>
        <p className="mt-1 text-sm text-slate-600">
          {session.email ?? 'Akun ini'} tidak terdaftar di tabel admin.
        </p>
        <form action={signOut} className="mt-6">
          <button type="submit" className={buttonClass('secondary')}>
            Keluar
          </button>
        </form>
      </div>
    )
  }
  return children
}

function AdminSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-label="Memuat">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-white ring-1 ring-slate-200" />
        ))}
      </div>
      <div className="h-96 rounded-2xl bg-white ring-1 ring-slate-200" />
    </div>
  )
}
