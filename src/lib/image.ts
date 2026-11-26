/**
 * Kompres foto di browser sebelum upload.
 *
 * Foto kamera HP biasanya 3 sampai 8 MB, padahal batas bukti transfer 2 MB.
 * Daripada menyuruh peserta mengecilkan sendiri, gambar diperkecil (sisi
 * terpanjang maks 1600 px) dan disimpan ulang sebagai JPEG. Hasilnya biasanya
 * di bawah 500 KB: upload lebih cepat di sinyal lemah dan tetap terbaca jelas.
 */
export async function compressImage(
  file: File,
  maxDimension = 1600,
  quality = 0.82,
): Promise<File> {
  // File kecil dengan format yang didukung dikirim apa adanya.
  const supported = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
  if (supported && file.size <= 1024 * 1024) return file

  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Browser tidak mendukung kompresi gambar')
  context.fillStyle = '#ffffff' // PNG transparan jadi latar putih, bukan hitam
  context.fillRect(0, 0, width, height)
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality),
  )
  if (!blob) throw new Error('Gagal mengompres gambar')
  const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
  return new File([blob], name, { type: 'image/jpeg' })
}
