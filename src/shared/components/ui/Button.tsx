import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../utils/cn'

type ButtonVariant = 'primary' | 'danger'

interface UIButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: ButtonVariant
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-white cursor-pointer font-bold w-full transition-all active:scale-[0.98]',
  danger:
    'px-6 py-3 bg-red-900 hover:bg-zinc-700 text-red-300 rounded-xl font-bold w-full transition-all border border-red-500/80 active:scale-[0.98] text-sm',
}

export function Button({ children, className, variant = 'primary', ...props }: UIButtonProps) {
  return (
    <button className={cn(variantClasses[variant], className)} {...props}>
      {children}
    </button>
  )
}
