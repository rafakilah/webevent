import Link from 'next/link'
import { eventConfig } from '@/config/event'
import { buttonClass } from '@/components/ui/button'

export default function StatusNotFound() {
  return (
    <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
      <h1 className="text-xl font-bold">Link tidak valid</h1>
      <p className="mt-2 text-slate-600">
        Pastikan link yang kamu buka sama persis dengan yang kamu terima setelah mendaftar. Kalau
        hilang, hubungi narahubung panitia dengan menyebutkan NIM.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <Link href="/#kontak" className={buttonClass('secondary')}>
          Hubungi panitia
        </Link>
        {eventConfig.registration.open && (
          <Link href="/daftar" className={buttonClass('primary')}>
            Daftar baru
          </Link>
        )}
      </div>
    </div>
  )
}
