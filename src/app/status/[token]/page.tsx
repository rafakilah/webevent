import { Suspense } from 'react'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { Container } from '@/components/ui/section'

// Placeholder Tahap 2. Halaman status lengkap (pembayaran + tiket) dibuat di Tahap 3.
export default function StatusPage({ params }: PageProps<'/status/[token]'>) {
  return (
    <>
      <SiteHeader showCta={false} />
      <main className="flex-1 py-12">
        <Container className="max-w-xl">
          <h1 className="text-2xl font-bold">Pendaftaran berhasil</h1>
          <Suspense fallback={<p className="mt-2 text-slate-500">Memuat...</p>}>
            {params.then(({ token }) => (
              <p className="mt-2 font-mono text-sm break-all text-slate-600">Token: {token}</p>
            ))}
          </Suspense>
        </Container>
      </main>
      <SiteFooter />
    </>
  )
}
