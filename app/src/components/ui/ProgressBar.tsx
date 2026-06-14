import { motion } from 'framer-motion'

interface ProgressBarProps {
  value: number      // 0–100
  max?: number
  color?: 'blue' | 'gold' | 'mint' | 'pink'
  size?: 'sm' | 'md'
  label?: string
  showValue?: boolean
  animated?: boolean
}

const colorClasses = {
  blue: 'bg-ice-blue',
  gold: 'bg-xp-gold',
  mint: 'bg-success-mint',
  pink: 'bg-error-pink',
}

const sizeClasses = { sm: 'h-1.5', md: 'h-2.5' }

export default function ProgressBar({
  value,
  max = 100,
  color = 'blue',
  size = 'md',
  label,
  showValue = false,
  animated = true,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between mb-1.5">
          {label && <span className="text-xs text-slate-400">{label}</span>}
          {showValue && (
            <span className="text-xs text-slate-400">
              {value} / {max}
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-surface-medium rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <motion.div
          className={`h-full rounded-full ${colorClasses[color]}`}
          initial={animated ? { width: 0 } : { width: `${pct}%` }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
