import { motion } from 'framer-motion'
import Button from '../ui/Button'
import ProgressBar from '../ui/ProgressBar'

interface SessionSummaryProps {
  correct: number
  incorrect: number
  xpEarned: number
  onRestart: () => void
  onExit: () => void
}

export default function SessionSummary({
  correct,
  incorrect,
  xpEarned,
  onRestart,
  onExit,
}: SessionSummaryProps) {
  const total = correct + incorrect
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
  const isPerfect = incorrect === 0 && total > 0

  return (
    <motion.div
      className="flex flex-col items-center gap-8 w-full max-w-sm mx-auto text-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <p className="text-5xl mb-3">{isPerfect ? '🌟' : accuracy >= 70 ? '✨' : '💪'}</p>
        <h2 className="text-2xl font-bold text-slate-700">
          {isPerfect ? 'Perfect Session!' : 'Session Complete'}
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          {isPerfect ? 'You knew every card!' : `${accuracy}% accuracy — keep it up!`}
        </p>
      </div>

      <div className="w-full bg-white rounded-lg shadow-soft p-6 flex flex-col gap-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Cards reviewed</span>
          <span className="font-semibold text-slate-700">{total}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Correct</span>
          <span className="font-semibold text-emerald-600">{correct}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Incorrect</span>
          <span className="font-semibold text-rose-500">{incorrect}</span>
        </div>
        <div className="pt-2 border-t border-surface-medium">
          <ProgressBar value={accuracy} color={accuracy >= 80 ? 'mint' : 'blue'} label="Accuracy" showValue={false} />
        </div>
        <motion.div
          className="flex items-center justify-center gap-2 bg-xp-gold/20 rounded-md py-2"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        >
          <span className="text-lg">⭐</span>
          <span className="font-bold text-amber-600">+{xpEarned} XP earned</span>
        </motion.div>
      </div>

      <div className="flex gap-3 w-full">
        <Button onClick={onExit} variant="secondary" fullWidth>Back to Dashboard</Button>
        <Button onClick={onRestart} variant="primary" fullWidth>Study More</Button>
      </div>
    </motion.div>
  )
}
