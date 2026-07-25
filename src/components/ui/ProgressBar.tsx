import { motion } from 'framer-motion'

interface ProgressBarProps {
  value: number
  max: number
  label?: string
  showPercent?: boolean
  className?: string
  color?: 'indigo' | 'green' | 'blue' | 'orange' | 'custom'
  barColor?: string
  /** Height in px — default 6 */
  height?: number
}

export function ProgressBar({
  value,
  max,
  label,
  showPercent = false,
  className = '',
  color = 'indigo',
  barColor,
  height = 6,
}: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0

  const barStyle = color === 'custom' && barColor
    ? { backgroundColor: barColor }
    : undefined

  const bgClass = color === 'custom' ? '' : {
    indigo: 'bg-[var(--accent-500)]',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
  }[color]

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercent) && (
        <div className="flex justify-between mb-1.5">
          {label && <span className="text-sm text-gray-500">{label}</span>}
          {showPercent && (
            <span className="text-sm font-medium text-gray-700">{percent.toFixed(0)}%</span>
          )}
        </div>
      )}
      <div
        className="w-full bg-gray-100 rounded-full overflow-hidden"
        style={{ height }}
      >
        <motion.div
          className={`h-full rounded-full ${bgClass ?? ''}`}
          style={barStyle}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  )
}
