import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

type PillVariant =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'examWarning'
  | 'typeBlue'
  | 'typeGreen'

interface PillProps {
  children: ReactNode
  className?: string
  variant?: PillVariant
}

const variantClasses: Record<PillVariant, string> = {
  neutral: 'text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20',
  success: 'text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20',
  warning: 'text-[10px] font-bold text-orange-400 border border-orange-500/20 bg-orange-500/10',
  danger: 'text-[9px] font-black bg-red-500/10 text-red-400 border border-red-500/20',
  examWarning: 'text-[9px] font-black bg-yellow-500/10 text-yellow-500 border border-yellow-500/20',
  typeBlue: 'text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter text-blue-100 bg-blue-600',
  typeGreen: 'text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter text-emerald-100 bg-emerald-600',
}

export function Pill({ children, className, variant = 'neutral' }: PillProps) {
  const isType = variant === 'typeBlue' || variant === 'typeGreen'
  return (
    <span
      className={cn(
        isType ? '' : 'rounded-full border px-2 py-0.5 whitespace-nowrap',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
