import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

/**
 * Proxy (dulu "middleware") berjalan sebelum halaman admin dirender:
 *   1. Me-refresh sesi Supabase yang kedaluwarsa dan menulis cookie baru.
 *   2. Mengarahkan pengunjung yang belum login ke /admin/login.
 *
 * Ini hanya lapisan kenyamanan (redirect cepat). Pengecekan "apakah admin"
 * tetap dilakukan di layout admin dan, yang terpenting, oleh RLS di database.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
        },
      },
    },
  )

  // getClaims() memverifikasi tanda tangan JWT. Jangan pakai getSession() di
  // server: isinya diambil dari cookie apa adanya dan bisa dipalsukan.
  const { data } = await supabase.auth.getClaims()
  const loggedIn = Boolean(data?.claims)
  const { pathname, search } = request.nextUrl

  if (pathname.startsWith('/api/admin')) {
    if (!loggedIn) return NextResponse.json({ error: 'Belum login' }, { status: 401 })
    return response
  }

  const isLoginPage = pathname === '/admin/login'
  if (!loggedIn && !isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    url.search = `?next=${encodeURIComponent(pathname + search)}`
    return NextResponse.redirect(url)
  }
  if (loggedIn && isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
