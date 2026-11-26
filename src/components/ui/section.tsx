import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-5xl px-4 sm:px-6', className)}>{children}</div>
}

export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  id: string
  eyebrow: string
  title: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn('py-16 sm:py-20', className)}>
      <Container>
        <div className="mb-8 max-w-2xl sm:mb-12">
          <p className="text-sm font-semibold tracking-wide text-brand-600 uppercase">{eyebrow}</p>
          <h2 id={`${id}-title`} className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h2>
          {description && <p className="mt-3 text-slate-600">{description}</p>}
        </div>
        {children}
      </Container>
    </section>
  )
}
