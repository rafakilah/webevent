'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, LogOut, ScanLine } from 'lucide-react'
import { signOut } from '@/actions/auth'
import { eventConfig } from '@/config/event'
import { cn } from '@/lib/cn'

const LINKS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/scan', label: 'Scan', icon: ScanLine },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        <Link href="/admin" className="mr-auto truncate font-bold">
          {eventConfig.name} <span className="font-normal text-slate-500">· Panitia</span>
        </Link>
        <nav aria-label="Navigasi panitia" className="flex items-center gap-1">
          {LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? 'page' : undefined}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium',
                pathname === href
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              <Icon className="size-4" aria-hidden />
              <span>{label}</span>
            </Link>
          ))}
          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
              title="Keluar"
            >
              <LogOut className="size-4" aria-hidden />
              <span className="sr-only sm:not-sr-only">Keluar</span>
            </button>
          </form>
        </nav>
      </div>
    </header>
  )
}
