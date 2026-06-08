import { motion, AnimatePresence } from 'framer-motion'
import type { Achievement } from '../../types/db'

interface AchievementToastProps {
  achievement: Achievement | null
  onDismiss: () => void
}

export default function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          key={achievement.key}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-4 bg-white rounded-lg shadow-modal px-5 py-4 min-w-64 border border-xp-gold/30"
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onAnimationComplete={(def) => {
            if (def === 'animate') {
              setTimeout(onDismiss, 3500)
            }
          }}
          onClick={onDismiss}
        >
          <div className="text-3xl">{achievement.icon}</div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-amber-500 uppercase tracking-wide">
              Achievement Unlocked
            </span>
            <span className="text-sm font-bold text-slate-700">{achievement.name}</span>
            <span className="text-xs text-slate-400">{achievement.description}</span>
          </div>
          <div className="ml-auto flex flex-col items-end gap-0.5">
            <span className="text-xs font-semibold text-xp-gold">+{achievement.xp_reward} XP</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
