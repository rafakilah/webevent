import { getAdminSession } from '@/lib/auth'
import { getAllParticipants } from '@/lib/admin-data'
import { toCsv } from '@/lib/csv'
import { formatDateTime } from '@/lib/format'
import { filterFromSearchParams, filterParticipants } from '@/lib/participant-filter'
import { STATUS_LABEL } from '@/components/status/status-badge'

/**
 * GET /api/admin/export?payment=lunas&checkin=belum&q=...
 * Tanpa parameter = semua peserta. Filter memakai fungsi yang sama dengan tabel.
 */
export async function GET(request: Request) {
  const session = await getAdminSession()
  if (session.status !== 'admin') {
    return Response.json({ error: 'Akses khusus admin' }, { status: 403 })
  }

  const url = new URL(request.url)
  const filter = filterFromSearchParams(url.searchParams)
  const rows = filterParticipants(await getAllParticipants(), filter)

  const csv = toCsv(
    [
      'Nama',
      'NIM',
      'Email',
      'No. WhatsApp',
      'Jurusan',
      'Status pembayaran',
      'Alasan ditolak',
      'Waktu daftar (WIB)',
      'Waktu verifikasi (WIB)',
      'Check-in (WIB)',
    ],
    rows.map((p) => [
      p.full_name,
      p.nim,
      p.email,
      p.phone,
      p.major,
      STATUS_LABEL[p.payment_status],
      p.rejection_reason,
      formatDateTime(p.created_at),
      p.verified_at && formatDateTime(p.verified_at),
      p.checked_in_at && formatDateTime(p.checked_in_at),
    ]),
  )

  const stamp = new Date().toISOString().slice(0, 10)
  const scope = url.searchParams.size > 0 ? 'filter' : 'semua'
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="peserta-${scope}-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
