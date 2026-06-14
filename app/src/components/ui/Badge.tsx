type BadgeColor = 'blue' | 'gold' | 'mint' | 'pink' | 'gray'

interface BadgeProps {
  children: string
  color?: BadgeColor
}

const colorClasses: Record<BadgeColor, string> = {
  blue:  'bg-sky-blue text-slate-300',
  gold:  'bg-xp-gold/40 text-amber-300',
  mint:  'bg-success-mint/40 text-emerald-400',
  pink:  'bg-error-pink/40 text-rose-400',
  gray:  'bg-surface-medium text-slate-400',
}

export default function Badge({ children, color = 'gray' }: BadgeProps) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]}`}>
      {children}
    </span>
  )
}
