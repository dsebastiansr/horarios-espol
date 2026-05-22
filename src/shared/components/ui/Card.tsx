import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface CardProps {
  children: ReactNode
  className?: string
  selected?: boolean
  hoverable?: boolean
}

export function Card({ children, className, selected = false, hoverable = false }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-zinc-800 bg-zinc-900',
        hoverable && 'hover:border-zinc-700',
        selected && 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/20',
        className
      )}
    >
      {children}
    </div>
  )
}
