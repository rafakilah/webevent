import { getAllParticipants, getDashboardStats } from '@/lib/admin-data'
import { Dashboard } from '@/components/admin/dashboard'

/*
 * Data diambil di server dengan sesi admin, lalu diserahkan ke komponen client
 * untuk filter dan interaksi. Setelah aksi (verifikasi, undo check-in), Server
 * Action memanggil refresh() sehingga komponen ini dirender ulang dengan data baru.
 */
export default async function AdminDashboardPage() {
  const [participants, stats] = await Promise.all([getAllParticipants(), getDashboardStats()])
  return <Dashboard participants={participants} stats={stats} />
}
