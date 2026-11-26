import { cn } from '@/lib/cn'

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'light' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 focus-visible:outline-brand-600',
  accent: 'bg-accent-400 text-brand-950 hover:bg-accent-300 focus-visible:outline-accent-400',
  secondary:
    'bg-white text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus-visible:outline-brand-600',
  ghost: 'text-slate-700 hover:bg-slate-100 focus-visible:outline-brand-600',
  light:
    'bg-white/10 text-white ring-1 ring-inset ring-white/25 hover:bg-white/20 focus-visible:outline-white',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
}

/**
 * Kelas tombol dipisah dari elemennya supaya bisa dipakai di <button>,
 * <Link>, maupun <a> tanpa komponen pembungkus yang rumit.
 */
export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors',
    'focus-visible:outline-2 focus-visible:outline-offset-2',
    'disabled:pointer-events-none disabled:opacity-60',
    variants[variant],
    sizes[size],
    className,
  )
}
