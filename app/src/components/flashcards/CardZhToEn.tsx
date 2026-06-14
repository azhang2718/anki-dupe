import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../ui/Button'
import type { Word } from '../../types/db'

interface CardZhToEnProps {
  word: Word
  isChallenge?: boolean
  onRate: (rating: 1 | 2 | 3 | 4) => void
}

export default function CardZhToEn({ word, isChallenge, onRate }: CardZhToEnProps) {
  const [revealed, setRevealed] = useState(false)

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
      {/* Card face */}
      <div className="w-full cosmic-panel rounded-lg shadow-float p-8 flex flex-col items-center gap-4 min-h-56">
        {isChallenge && (
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-xp-gold/15 text-amber-400 border border-xp-gold/25 self-start">
            ⚡ Mastered — stay sharp
          </span>
        )}
        <p
          className="font-chinese text-6xl font-bold text-slate-100 tracking-wider"
          style={{ textShadow: '0 2px 12px rgba(169,214,255,0.4)' }}
        >
          {word.chinese}
        </p>

        <AnimatePresence>
          {revealed && (
            <motion.div
              className="flex flex-col items-center gap-2 w-full border-t border-surface-medium pt-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-slate-400 text-lg tracking-wide">{word.pinyin}</p>
              <p className="text-slate-200 text-xl font-semibold">{word.meaning}</p>
              {word.example_sentence && (
                <div className="mt-2 bg-surface-light rounded-md p-3 w-full">
                  <p className="font-chinese text-sm text-slate-300">{word.example_sentence}</p>
                  {word.example_translation && (
                    <p className="text-xs text-slate-400 mt-1">{word.example_translation}</p>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      {!revealed ? (
        <Button onClick={() => setRevealed(true)} variant="primary" size="lg" fullWidth>
          Show Answer
        </Button>
      ) : (
        <motion.div
          className="grid grid-cols-3 gap-3 w-full"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
        >
          {/* Don't know — 0 XP, penalty if challenge/high-lapse */}
          <button
            onClick={() => onRate(1)}
            className="no-drag flex flex-col items-center gap-1 bg-error-pink/20 hover:bg-error-pink/40 border border-error-pink/30 rounded-md py-3 px-2 transition-colors"
          >
            <span className="text-lg">😵</span>
            <span className="text-xs font-semibold text-rose-600">Don't know</span>
          </button>
          <button
            onClick={() => onRate(2)}
            className="no-drag flex flex-col items-center gap-1 bg-xp-gold/20 hover:bg-xp-gold/40 border border-xp-gold/30 rounded-md py-3 px-2 transition-colors"
          >
            <span className="text-lg">😐</span>
            <span className="text-xs font-semibold text-amber-400">Partial</span>
          </button>
          <button
            onClick={() => onRate(4)}
            className="no-drag flex flex-col items-center gap-1 bg-success-mint/20 hover:bg-success-mint/40 border border-success-mint/30 rounded-md py-3 px-2 transition-colors"
          >
            <span className="text-lg">😊</span>
            <span className="text-xs font-semibold text-emerald-400">Know it</span>
          </button>
        </motion.div>
      )}
    </div>
  )
}
