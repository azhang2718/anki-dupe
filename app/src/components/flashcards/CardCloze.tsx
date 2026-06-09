import { useState } from 'react'
import { motion } from 'framer-motion'
import Button from '../ui/Button'
import type { Word } from '../../types/db'

interface CardClozeProps {
  word: Word
  isChallenge?: boolean
  onRate: (rating: 1 | 2 | 3 | 4) => void
}

export default function CardCloze({ word, isChallenge, onRate }: CardClozeProps) {
  const [revealed, setRevealed] = useState(false)

  const clozed = word.example_sentence
    ? word.example_sentence.replace(word.chinese, '_____')
    : `_____ (${word.meaning})`

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
      <div className="w-full bg-white rounded-lg shadow-float p-8 flex flex-col items-center gap-4 min-h-48">
        {isChallenge && (
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-xp-gold/15 text-amber-600 border border-xp-gold/25 self-start">
            ⚡ Mastered — stay sharp
          </span>
        )}
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Fill in the blank</p>

        <p className="font-chinese text-2xl text-slate-700 text-center leading-relaxed">
          {clozed}
        </p>

        {revealed && (
          <motion.div
            className="flex flex-col items-center gap-1 border-t border-surface-medium pt-4 w-full"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p
              className="font-chinese text-4xl font-bold text-slate-800"
              style={{ textShadow: '0 2px 12px rgba(149,240,192,0.5)' }}
            >
              {word.chinese}
            </p>
            <p className="text-slate-400 text-base">{word.pinyin}</p>
            {word.example_sentence && (
              <p className="font-chinese text-sm text-slate-500 mt-1">{word.example_sentence}</p>
            )}
          </motion.div>
        )}
      </div>

      {!revealed ? (
        <Button onClick={() => setRevealed(true)} variant="primary" size="lg" fullWidth>
          Reveal
        </Button>
      ) : (
        <motion.div
          className="grid grid-cols-3 gap-3 w-full"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
        >
          <button
            onClick={() => onRate(1)}
            className="no-drag flex flex-col items-center gap-1 bg-error-pink/20 hover:bg-error-pink/40 border border-error-pink/30 rounded-md py-3 transition-colors"
          >
            <span className="text-sm font-semibold text-rose-600">Don't know</span>
            <span className="text-[10px] text-slate-400">+0 XP</span>
          </button>
          <button
            onClick={() => onRate(2)}
            className="no-drag flex flex-col items-center gap-1 bg-xp-gold/20 hover:bg-xp-gold/40 border border-xp-gold/30 rounded-md py-3 transition-colors"
          >
            <span className="text-sm font-semibold text-amber-600">Partial</span>
            <span className="text-[10px] text-slate-400">+3 XP</span>
          </button>
          <button
            onClick={() => onRate(4)}
            className="no-drag flex flex-col items-center gap-1 bg-success-mint/20 hover:bg-success-mint/40 border border-success-mint/30 rounded-md py-3 transition-colors"
          >
            <span className="text-sm font-semibold text-emerald-600">Got it</span>
            <span className="text-[10px] text-slate-400">+10 XP</span>
          </button>
        </motion.div>
      )}
    </div>
  )
}
