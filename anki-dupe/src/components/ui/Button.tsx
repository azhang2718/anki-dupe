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
  primary:   'bg-ice-blue text-slate-700 hover:bg-focus-blue hover:text-white shadow-soft',
  secondary: 'bg-surface-medium text-slate-600 hover:bg-silver-blue hover:text-slate-700',
  ghost:     'bg-transparent text-slate-500 hover:bg-surface-medium hover:text-slate-700',
  success:   'bg-success-mint text-slate-700 hover:brightness-95',
  danger:    'bg-error-pink text-slate-700 hover:brightness-95',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
}

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
      whileTap={{ scale: disabled ? 1 : 0.96 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      transition={{ duration: 0.15 }}
      className={[
        'rounded-md font-medium transition-colors duration-150 select-none no-drag',
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
