import type { Metadata } from 'next'
import { ScanStation } from '@/components/scan/scan-station'

export const metadata: Metadata = { title: 'Scan tiket' }

/*
 * Halaman scan sengaja ringan: tidak ada data yang dimuat di server, semua
 * kerja terjadi di browser (kamera + satu request RPC per scan).
 */
export default function ScanPage() {
  return <ScanStation />
}
