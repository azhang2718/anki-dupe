import { motion, AnimatePresence } from 'framer-motion'

const LEVEL_TITLES: [number, string][] = [
  [100, 'Character Sage'],
  [50,  'Novel Reader'],
  [25,  'Web Reader'],
  [10,  'Casual Reader'],
  [5,   'Curious Reader'],
  [1,   'Beginner Reader'],
]

function getLevelTitle(level: number): string {
  return LEVEL_TITLES.find(([n]) => level >= n)?.[1] ?? 'Beginner Reader'
}

interface LevelUpOverlayProps {
  level: number | null
  onDismiss: () => void
}

export default function LevelUpOverlay({ level, onDismiss }: LevelUpOverlayProps) {
  return (
    <AnimatePresence>
      {level !== null && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onDismiss}
          />
          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4 bg-white rounded-lg shadow-modal px-10 py-8 text-center"
            initial={{ opacity: 0, scale: 0.8, y: '-45%' }}
            animate={{ opacity: 1, scale: 1, y: '-50%' }}
            exit={{ opacity: 0, scale: 0.9, y: '-45%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 20 }}
          >
            <motion.div
              initial={{ rotate: -15, scale: 0.5 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="text-5xl"
            >
              🎊
            </motion.div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Level Up!</p>
              <p className="text-4xl font-bold text-slate-800 mt-1">Level {level}</p>
              <p className="text-base text-slate-500 mt-1">{getLevelTitle(level)}</p>
            </div>
            <motion.div
              className="px-4 py-2 bg-xp-gold/30 rounded-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-sm font-semibold text-amber-600">Keep studying to reach the next level!</p>
            </motion.div>
            <button
              onClick={onDismiss}
              className="no-drag text-xs text-slate-400 hover:text-slate-600 mt-1"
            >
              Tap to continue
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
