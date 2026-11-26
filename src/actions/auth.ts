'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type SignInState = { message?: string; email?: string }

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Format email tidak valid')),
  password: z.string().min(1, 'Password wajib diisi'),
  next: z.string().optional(),
})

/** Hanya izinkan redirect ke halaman admin sendiri (mencegah open redirect). */
function safeNext(next: string | undefined) {
  return next && next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin'
}

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { message: parsed.error.issues[0].message, email: String(formData.get('email') ?? '') }
  }
  const { email, password, next } = parsed.data

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    // Pesan sengaja umum: jangan beri tahu apakah email terdaftar atau tidak.
    return { message: 'Email atau password salah.', email }
  }

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) {
    await supabase.auth.signOut()
    return { message: 'Akun ini tidak terdaftar sebagai panitia.', email }
  }

  redirect(safeNext(next))
}

export async function signOut() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
