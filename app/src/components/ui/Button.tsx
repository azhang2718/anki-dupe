import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'success' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps {
  children: ReactNode
  variant?: Variant
  size?: Size
  disabled?: boolean
  fullWidth?: boolean
  onClick?: () => void
  type?: 'button' | 'submit'
  className?: string
}

const variantClasses: Record<Variant, string> = {
  primary:   'bg-ice-blue text-slate-200 hover:bg-focus-blue hover:text-white shadow-soft',
  secondary: 'bg-surface-medium text-slate-300 hover:bg-silver-blue hover:text-slate-200',
  ghost:     'bg-transparent text-slate-400 hover:bg-surface-medium hover:text-slate-200',
  success:   'bg-success-mint text-slate-200 hover:brightness-95',
  danger:    'bg-error-pink text-slate-200 hover:brightness-95',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
}

// Emil: buttons must feel responsive — scale(0.97) on active gives instant physical feedback.
// No hover scale — color/bg transitions only; scaling nav/toolbar buttons is an AI tell.
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
      className={[
        'rounded-md font-medium select-none no-drag',
        'transition-colors duration-150',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
    >
      {children}
    </motion.button>
  )
}
