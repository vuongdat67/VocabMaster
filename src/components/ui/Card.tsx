import { type CSSProperties, type ReactNode, type MouseEvent } from 'react'
import { motion } from 'framer-motion'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: (e: MouseEvent<HTMLDivElement>) => void
  hover?: boolean
  style?: CSSProperties
  /** Remove border for a cleaner look */
  borderless?: boolean
  /** Smaller internal padding */
  compact?: boolean
}

export function Card({
  children,
  className = '',
  onClick,
  hover = false,
  style,
  borderless = false,
  compact = false,
}: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -2, transition: { type: 'spring', stiffness: 300 } } : undefined}
      className={[
        'bg-white rounded-xl shadow-[var(--shadow-card)]',
        borderless ? '' : 'border border-gray-200',
        hover ? 'cursor-pointer' : '',
        compact ? 'p-3' : 'p-4',
        className,
      ].filter(Boolean).join(' ')}
      onClick={onClick}
      style={style}
      layout
    >
      {children}
    </motion.div>
  )
}
