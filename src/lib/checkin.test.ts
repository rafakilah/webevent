import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { isTicketToken, performCheckIn } from './checkin'

type RpcResponse = { data: unknown; error: { code?: string; message: string } | null }

/** Supabase palsu: setiap panggilan rpc() mengambil langkah berikutnya dari daftar. */
function fakeSupabase(steps: Array<RpcResponse | Error>) {
  const rpc = vi.fn(() => {
    const step = steps.shift()
    return {
      abortSignal: () => (step instanceof Error ? Promise.reject(step) : Promise.resolve(step)),
    }
  })
  return { client: { rpc } as unknown as SupabaseClient<Database>, rpc }
}

const row = (result: string, checkedInAt: string | null) => ({
  data: [
    {
      result,
      participant_id: 'p1',
      full_name: 'Ayu',
      nim: '1',
      major: 'M',
      checked_in_at: checkedInAt,
    },
  ],
  error: null,
})

describe('isTicketToken', () => {
  it('hanya menerima 32 karakter hex', () => {
    expect(isTicketToken('7bcd7395f2f900b54d3d76727380042e')).toBe(true)
    expect(isTicketToken('https://contoh.com')).toBe(false)
    expect(isTicketToken('7BCD7395F2F900B54D3D76727380042E')).toBe(false)
  })
})

describe('performCheckIn', () => {
  it('meneruskan hasil database apa adanya', async () => {
    const { client } = fakeSupabase([row('sudah', '2027-01-23T01:00:00Z')])
    const outcome = await performCheckIn(client, { token: 'a'.repeat(32) })
    expect(outcome).toMatchObject({ kind: 'sudah', fullName: 'Ayu' })
  })

  it('retry setelah gagal jaringan: "sudah" dengan jam barusan dianggap berhasil', async () => {
    // Request pertama sebenarnya sampai ke server tapi responsnya hilang.
    const { client, rpc } = fakeSupabase([
      new Error('Failed to fetch'),
      row('sudah', new Date().toISOString()),
    ])
    const outcome = await performCheckIn(client, { token: 'a'.repeat(32) })
    expect(rpc).toHaveBeenCalledTimes(2)
    expect(outcome.kind).toBe('berhasil')
  })

  it('retry tetap "sudah" kalau check-in pertama jauh sebelumnya', async () => {
    const { client } = fakeSupabase([new Error('timeout'), row('sudah', '2020-01-01T00:00:00Z')])
    const outcome = await performCheckIn(client, { token: 'a'.repeat(32) })
    expect(outcome.kind).toBe('sudah')
  })

  it('dua kali gagal jaringan -> pesan gagal_jaringan', async () => {
    const { client } = fakeSupabase([new Error('x'), new Error('y')])
    const outcome = await performCheckIn(client, { participantId: 'p1' })
    expect(outcome.kind).toBe('gagal_jaringan')
  })

  it('sesi bukan admin tidak di-retry', async () => {
    const { client, rpc } = fakeSupabase([
      { data: null, error: { code: '42501', message: 'Akses khusus admin' } },
    ])
    const outcome = await performCheckIn(client, { token: 'a'.repeat(32) })
    expect(rpc).toHaveBeenCalledTimes(1)
    expect(outcome.kind).toBe('gagal_jaringan')
  })
})
