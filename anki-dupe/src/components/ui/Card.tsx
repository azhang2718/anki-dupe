import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  glass?: boolean
  className?: string
  onClick?: () => void
  padding?: 'sm' | 'md' | 'lg'
}

const paddingClasses = { sm: 'p-4', md: 'p-6', lg: 'p-8' }

export default function Card({
  children,
  glass = false,
  className = '',
  onClick,
  padding = 'md',
}: CardProps) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={onClick ? { scale: 1.01, y: -2 } : {}}
      whileTap={onClick ? { scale: 0.99 } : {}}
      className={[
        'rounded-lg shadow-soft',
        glass ? 'glass' : 'bg-white',
        paddingClasses[padding],
        onClick ? 'cursor-pointer hover:shadow-float transition-all duration-200' : '',
        className,
      ].join(' ')}
    >
      {children}
    </motion.div>
  )
}
