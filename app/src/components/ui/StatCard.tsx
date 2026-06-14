interface StatCardProps {
  label: string
  value: string | number
  icon?: string
  color?: 'blue' | 'gold' | 'mint' | 'default'
  subtext?: string
}

const colorClasses = {
  blue:    'bg-sky-blue',
  gold:    'bg-xp-gold/30',
  mint:    'bg-success-mint/30',
  default: 'bg-surface-medium',
}

export default function StatCard({ label, value, icon, color = 'default', subtext }: StatCardProps) {
  return (
    <div className={`${colorClasses[color]} rounded-lg p-6 shadow-soft`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-bold text-slate-200 mt-1.5">{value}</p>
          {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
        {icon && <span className="text-2xl opacity-70">{icon}</span>}
      </div>
    </div>
  )
}
