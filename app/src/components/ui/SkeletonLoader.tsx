interface SkeletonProps {
  className?: string
  lines?: number
}

function SkeletonLine({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-surface-medium rounded-md animate-pulse ${className}`}
      style={{ animationDuration: '1.5s' }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-surface-medium rounded-lg shadow-soft p-6 space-y-3">
      <SkeletonLine className="h-4 w-1/3" />
      <SkeletonLine className="h-8 w-1/2" />
      <SkeletonLine className="h-3 w-2/3" />
    </div>
  )
}

export default function SkeletonLoader({ lines = 3, className = '' }: SkeletonProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine
          key={i}
          className={`h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  )
}
