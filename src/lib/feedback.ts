/**
 * Feedback getar + bunyi untuk halaman scan. Bunyi dibuat dengan Web Audio API
 * (gelombang sinus), jadi tidak ada file audio yang perlu diunduh.
 *
 * Browser HP hanya mengizinkan audio setelah interaksi pengguna, karena itu
 * unlockAudio() dipanggil saat panitia menekan tombol "Mulai scan".
 */
let audioContext: AudioContext | null = null

export function unlockAudio() {
  if (typeof window === 'undefined') return
  audioContext ??= new AudioContext()
  if (audioContext.state === 'suspended') void audioContext.resume()
}

function tone(frequency: number, startOffset: number, duration: number) {
  if (!audioContext) return
  const oscillator = audioContext.createOscillator()
  const gain = audioContext.createGain()
  const start = audioContext.currentTime + startOffset
  oscillator.frequency.value = frequency
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(0.3, start + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  oscillator.connect(gain).connect(audioContext.destination)
  oscillator.start(start)
  oscillator.stop(start + duration + 0.02)
}

export type FeedbackKind = 'success' | 'warning' | 'error'

export function feedback(kind: FeedbackKind) {
  const patterns: Record<FeedbackKind, number[]> = {
    success: [120],
    warning: [80, 80, 80],
    error: [400],
  }
  // navigator.vibrate tidak ada di iOS Safari; cek dulu supaya tidak error.
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(patterns[kind])

  try {
    if (kind === 'success') tone(1046, 0, 0.15)
    if (kind === 'warning') {
      tone(660, 0, 0.1)
      tone(660, 0.16, 0.1)
    }
    if (kind === 'error') tone(196, 0, 0.35)
  } catch {
    // Audio bukan fitur kritis.
  }
}
