import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import type { Word } from '../../types/db'

interface CardEnToZhProps {
  word: Word
  allWords: Word[]
  onRate: (rating: 1 | 2 | 3 | 4) => void
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

export default function CardEnToZh({ word, allWords, onRate }: CardEnToZhProps) {
  const [selected, setSelected] = useState<string | null>(null)

  const choices = useMemo(() => {
    const distractors = allWords
      .filter((w) => w.id !== word.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((w) => w.chinese)
    return shuffle([word.chinese, ...distractors])
  }, [word.id])

  const isCorrect = selected === word.chinese

  function handleSelect(choice: string) {
    if (selected) return
    setSelected(choice)
    const correct = choice === word.chinese
    setTimeout(() => onRate(correct ? 4 : 1), 900)
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
      <div className="w-full cosmic-panel rounded-lg shadow-float p-8 flex flex-col items-center gap-2 min-h-40">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Which character means…</p>
        <p className="text-2xl font-semibold text-slate-200 text-center">{word.meaning}</p>
        {word.part_of_speech && (
          <p className="text-xs text-slate-400 italic">{word.part_of_speech}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 w-full">
        {choices.map((choice) => {
          const isThis = choice === word.chinese
          let bg = 'bg-surface-medium hover:bg-surface-light border-surface-medium hover:border-ice-blue'
          if (selected) {
            if (isThis) bg = 'bg-success-mint/30 border-success-mint'
            else if (choice === selected) bg = 'bg-error-pink/30 border-error-pink'
            else bg = 'bg-surface-medium border-surface-medium opacity-50'
          }

          return (
            <motion.button
              key={choice}
              onClick={() => handleSelect(choice)}
              whileTap={{ scale: selected ? 1 : 0.97 }}
              className={`no-drag font-chinese text-3xl font-bold py-5 rounded-md border-2 transition-colors ${bg}`}
            >
              {choice}
            </motion.button>
          )
        })}
      </div>

      {selected && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`text-sm font-medium ${isCorrect ? 'text-emerald-400' : 'text-rose-500'}`}
        >
          {isCorrect ? `✓ Correct! ${word.chinese} — ${word.pinyin}` : `✗ The answer was ${word.chinese} (${word.pinyin})`}
        </motion.p>
      )}
    </div>
  )
}
