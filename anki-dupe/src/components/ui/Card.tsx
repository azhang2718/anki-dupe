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
    <div
      onClick={onClick}
      className={[
        'rounded-lg shadow-soft',
        glass ? 'glass' : 'bg-white',
        paddingClasses[padding],
        onClick ? 'cursor-pointer hover:shadow-float transition-shadow duration-200' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
