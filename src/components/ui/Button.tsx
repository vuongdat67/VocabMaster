import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { motion } from 'framer-motion'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  isLoading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  isLoading,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none'

  const variants: Record<string, string> = {
    primary:
      'text-white shadow-sm hover:shadow-md active:shadow-sm' +
      ' bg-[var(--accent-600)] hover:bg-[var(--accent-700)] active:bg-[var(--accent-800)]' +
      ' focus:ring-[var(--accent-400)]',
    secondary:
      'bg-gray-50 text-gray-700 hover:bg-gray-100 active:bg-gray-200 border border-gray-200' +
      ' focus:ring-gray-400',
    ghost:
      'text-gray-500 hover:text-gray-700 hover:bg-gray-100 active:bg-gray-200' +
      ' focus:ring-gray-400',
    danger:
      'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm' +
      ' focus:ring-red-500',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="flex items-center">{icon}</span>
      ) : null}
      {children}
    </motion.button>
  )
}
