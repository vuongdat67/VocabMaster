import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

const variants = {
  default: 'bg-gray-100 text-gray-600',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200/50',
  danger: 'bg-red-50 text-red-700 border border-red-200/50',
  info: 'bg-[var(--accent-50)] text-[var(--accent-700)]',
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium leading-4 ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
