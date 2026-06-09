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

// Emil: scale on card hover is an AI tell. Use shadow lift only for elevation feedback.
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
      whileTap={onClick ? { scale: 0.99 } : {}}
      transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
      className={[
        'rounded-lg shadow-soft',
        glass ? 'glass' : 'bg-white',
        paddingClasses[padding],
        onClick
          ? 'cursor-pointer hover:shadow-float transition-shadow duration-200'
          : '',
        className,
      ].join(' ')}
    >
      {children}
    </motion.div>
  )
}
