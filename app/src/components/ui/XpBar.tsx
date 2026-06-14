import { motion } from 'framer-motion'
import ProgressBar from './ProgressBar'

interface XpBarProps {
  totalXp: number
  level: number
  compact?: boolean
}

function xpForLevel(level: number): number {
  let xp = 0
  for (let i = 1; i < level; i++) xp += i * 100
  return xp
}

export default function XpBar({ totalXp, level, compact = false }: XpBarProps) {
  const currentLevelXp = xpForLevel(level)
  const nextLevelXp = xpForLevel(level + 1)
  const progressXp = totalXp - currentLevelXp
  const neededXp = nextLevelXp - currentLevelXp

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-400">Lv.{level}</span>
        <div className="flex-1">
          <ProgressBar value={progressXp} max={neededXp} color="gold" size="sm" animated={false} />
        </div>
        <span className="text-xs text-slate-400">{totalXp} XP</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-baseline">
        <div className="flex items-baseline gap-1.5">
          <motion.span
            key={level}
            initial={{ scale: 1.3, color: '#FFD866' }}
            animate={{ scale: 1, color: '#64748b' }}
            transition={{ duration: 0.4 }}
            className="text-sm font-bold text-slate-300"
          >
            Level {level}
          </motion.span>
        </div>
        <span className="text-xs text-slate-400">
          {progressXp} / {neededXp} XP
        </span>
      </div>
      <ProgressBar value={progressXp} max={neededXp} color="gold" size="md" />
    </div>
  )
}
