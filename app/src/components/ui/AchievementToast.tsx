import { motion, AnimatePresence } from 'framer-motion'
import { Trophy } from '@phosphor-icons/react'
import type { Achievement } from '../../types/db'

interface AchievementToastProps {
  achievement: Achievement | null
  onDismiss: () => void
}

// Emil: spatial consistency — toast enters and exits from the same edge (bottom-right).
// Asymmetric timing: enter 280ms, exit 160ms (fast exit = system responding).
// Custom ease-out curve for snappy entry.
export default function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          key={achievement.key}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-white rounded-lg shadow-modal px-4 py-3.5 min-w-60 max-w-72 border border-xp-gold/25 cursor-pointer"
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          exit={{    opacity: 0, y: 8,  scale: 0.97 }}
          transition={{
            enter:   { duration: 0.28, ease: [0.23, 1, 0.32, 1] },
            exit:    { duration: 0.16, ease: [0.23, 1, 0.32, 1] },
            default: { duration: 0.28, ease: [0.23, 1, 0.32, 1] },
          }}
          onAnimationComplete={(def) => {
            if (def === 'animate') {
              setTimeout(onDismiss, 3500)
            }
          }}
          onClick={onDismiss}
        >
          <div className="w-9 h-9 rounded-md bg-xp-gold/15 flex items-center justify-center shrink-0">
            <Trophy size={18} weight="fill" className="text-amber-500" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider leading-none mb-0.5">
              Achievement Unlocked
            </span>
            <span className="text-sm font-semibold text-slate-700 truncate">{achievement.name}</span>
            <span className="text-xs text-slate-400 truncate">{achievement.description}</span>
          </div>
          <div className="ml-auto shrink-0">
            <span className="text-xs font-semibold text-amber-500">+{achievement.xp_reward} XP</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
