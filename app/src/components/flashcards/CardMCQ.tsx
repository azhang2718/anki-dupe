import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { LANGUAGE_CONFIGS, type LanguageCode } from '../../types/languages'
import type { Word } from '../../types/db'

interface CardMCQProps {
  word: Word
  allWords: Word[]
  activeLang: LanguageCode
  onRate: (rating: 1 | 2 | 3 | 4) => void
  /** Called with the id of a wrong-choice word so its card can be penalised */
  onPenalizeWord: (wordId: number) => void
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function CardMCQ({ word, allWords, activeLang, onRate, onPenalizeWord }: CardMCQProps) {
  const [selected, setSelected] = useState<number | null>(null) // stores chosen word id
  const langConfig = LANGUAGE_CONFIGS[activeLang]

  // Build 3 distractors: prefer words close in difficulty, then random
  const choices = useMemo<Word[]>(() => {
    const pool = allWords.filter((w) => w.id !== word.id)
    // Try same difficulty first, fall back to anything
    const sameDiff = pool.filter((w) => Math.abs(w.difficulty - word.difficulty) <= 1)
    const candidates = sameDiff.length >= 3 ? sameDiff : pool
    const distractors = shuffle(candidates).slice(0, 3)
    return shuffle([word, ...distractors])
  }, [word.id])

  const answered = selected !== null
  const correct = selected === word.id

  function handleSelect(chosen: Word) {
    if (answered) return
    setSelected(chosen.id)

    if (chosen.id === word.id) {
      // Correct — rate good after brief pause
      setTimeout(() => onRate(4), 850)
    } else {
      // Wrong — penalise the distractor that was clicked, then rate again
      onPenalizeWord(chosen.id)
      setTimeout(() => onRate(1), 850)
    }
  }

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-md mx-auto">
      {/* Prompt card */}
      <div className="w-full cosmic-panel rounded-xl shadow-float px-8 py-7 flex flex-col items-center gap-2 min-h-36">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
          Which {langConfig.charLabel.toLowerCase()} means…
        </p>
        <p className="text-2xl font-semibold text-slate-100 text-center leading-snug mt-1">
          {word.meaning}
        </p>
        {word.part_of_speech && (
          <p className="text-xs text-slate-400 italic mt-0.5">{word.part_of_speech}</p>
        )}
      </div>

      {/* Choice grid */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {choices.map((choice) => {
          const isCorrectChoice = choice.id === word.id
          const isChosen = choice.id === selected

          let classes = 'border-2 transition-all duration-150'
          if (!answered) {
            classes += ' bg-surface-medium hover:bg-surface-light border-surface-medium hover:border-ice-blue hover:shadow-soft cursor-pointer'
          } else if (isCorrectChoice) {
            classes += ' bg-success-mint/25 border-success-mint shadow-none'
          } else if (isChosen) {
            classes += ' bg-error-pink/25 border-error-pink shadow-none'
          } else {
            classes += ' bg-surface-medium border-surface-medium opacity-40 cursor-default'
          }

          return (
            <motion.button
              key={choice.id}
              onClick={() => handleSelect(choice)}
              whileTap={{ scale: answered ? 1 : 0.96 }}
              transition={{ duration: 0.1 }}
              className={`no-drag flex flex-col items-center justify-center gap-1 rounded-xl py-5 px-3 ${classes}`}
            >
              <span
                className="text-3xl font-bold text-slate-100 leading-none"
                style={{ fontFamily: langConfig.fontFamily }}
              >
                {choice.chinese}
              </span>
              {/* Show reading hint only after answering */}
              {answered && isCorrectChoice && (
                <motion.span
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="text-[11px] text-slate-400 tracking-wide mt-0.5"
                >
                  {choice.pinyin}
                </motion.span>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Feedback line */}
      {answered && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className={`text-sm font-medium text-center ${correct ? 'text-emerald-400' : 'text-rose-500'}`}
        >
          {correct
            ? `✓ Correct! — ${word.pinyin}`
            : `✗ The answer was ${word.chinese} (${word.pinyin})`}
        </motion.div>
      )}
    </div>
  )
}
