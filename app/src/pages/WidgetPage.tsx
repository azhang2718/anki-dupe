import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { scheduleReview } from '../utils/fsrs'
import type { Word, Card } from '../types/db'

interface CurrentCard { card: Card; word: Word }

type RatingKey = 'again' | 'hard' | 'good'
const RATINGS: { key: RatingKey; label: string; value: 1 | 2 | 4; color: string }[] = [
  { key: 'again', label: 'Again', value: 1, color: 'hover:bg-error-pink/30 border-error-pink/20 text-rose-500' },
  { key: 'hard',  label: 'Hard',  value: 2, color: 'hover:bg-xp-gold/30 border-xp-gold/20 text-amber-500' },
  { key: 'good',  label: 'Know',  value: 4, color: 'hover:bg-success-mint/30 border-success-mint/20 text-emerald-500' },
]

export default function WidgetPage() {
  const [expanded, setExpanded]           = useState(false)
  const [alwaysOnTop, setAlwaysOnTopState]= useState(false)
  const [current, setCurrent]             = useState<CurrentCard | null>(null)
  const [revealed, setRevealed]           = useState(false)
  const [dueCount, setDueCount]           = useState(0)
  const [cardKey, setCardKey]             = useState(0)

  const loadNext = useCallback(async () => {
    const dueCards = await window.db.cards.getDue(1)
    setDueCount(await window.db.cards.countDue())
    if (dueCards[0]) {
      const word = await window.db.words.getById(dueCards[0].word_id)
      if (word) setCurrent({ card: dueCards[0], word })
      else setCurrent(null)
    } else {
      setCurrent(null)
    }
    setRevealed(false)
  }, [])

  useEffect(() => { loadNext() }, [])

  async function handleRate(rating: 1 | 2 | 4) {
    if (!current) return
    const fsrs = scheduleReview(current.card, rating)

    await Promise.all([
      window.db.cards.update(current.card.id, {
        due: fsrs.due, state: fsrs.state,
        stability: fsrs.stability, difficulty: fsrs.difficulty,
        elapsed_days: fsrs.elapsed_days, scheduled_days: fsrs.scheduled_days,
        reps: fsrs.reps, lapses: fsrs.lapses,
        last_review: new Date().toISOString(),
      }),
      window.db.reviews.create({
        card_id: current.card.id, word_id: current.word.id,
        rating, time_taken_ms: 0, xp_earned: 0,
      }),
    ])

    setCardKey(k => k + 1)
    await loadNext()
  }

  function toggleExpanded() {
    const next = !expanded
    setExpanded(next)
    window.electronAPI?.widget?.setExpanded(next)
  }

  function toggleAlwaysOnTop() {
    const next = !alwaysOnTop
    setAlwaysOnTopState(next)
    window.electronAPI?.widget?.setAlwaysOnTop(next)
  }

  return (
    <div
      className="w-full h-screen overflow-hidden"
      style={{ background: 'transparent' }}
    >
      <motion.div
        className="relative w-full h-full glass-strong rounded-widget shadow-modal flex flex-col overflow-hidden"
        layout
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {/* ── Header ── */}
        <div className="drag-region flex items-center justify-between px-4 py-3 border-b border-white/30">
          <div className="flex items-center gap-2">
            <span className="text-base">🀄</span>
            <p className="text-xs font-bold text-slate-200 leading-none">Anki Dupe</p>
          </div>
          <div className="no-drag flex items-center gap-1.5">
            <button
              onClick={toggleAlwaysOnTop}
              title="Always on top"
              className={`text-sm px-1.5 py-0.5 rounded transition-colors ${alwaysOnTop ? 'text-focus-blue' : 'text-slate-300 hover:text-slate-400'}`}
            >
              📌
            </button>
            <button
              onClick={toggleExpanded}
              className="text-slate-300 hover:text-slate-400 text-xs px-1 transition-colors"
            >
              {expanded ? '⊟' : '⊞'}
            </button>
          </div>
        </div>

        {/* ── Card area ── */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-4 gap-4">
          <AnimatePresence mode="wait">
            {current ? (
              <motion.div
                key={cardKey}
                className="w-full flex flex-col items-center gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Chinese character */}
                <div className="flex flex-col items-center gap-1">
                  <p
                    className="font-chinese font-bold text-slate-100 select-none"
                    style={{ fontSize: expanded ? '4rem' : '3rem', textShadow: '0 2px 16px rgba(169,214,255,0.5)' }}
                  >
                    {current.word.chinese}
                  </p>

                  <AnimatePresence>
                    {revealed && (
                      <motion.div
                        className="flex flex-col items-center gap-1"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18 }}
                      >
                        <p className="text-slate-400 text-sm tracking-wider">{current.word.pinyin}</p>
                        <p className="text-slate-200 font-semibold text-base">{current.word.meaning}</p>
                        {expanded && current.word.example_sentence && (
                          <p className="font-chinese text-xs text-slate-400 text-center mt-1 px-2">
                            {current.word.example_sentence}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-surface-medium/40" />

                {/* Buttons */}
                {!revealed ? (
                  <button
                    onClick={() => setRevealed(true)}
                    className="no-drag w-full py-2.5 bg-ice-blue/60 hover:bg-ice-blue rounded-md text-sm font-semibold text-slate-200 transition-colors"
                  >
                    Show Answer
                  </button>
                ) : (
                  <div className="grid grid-cols-3 gap-2 w-full">
                    {RATINGS.map(r => (
                      <button
                        key={r.key}
                        onClick={() => handleRate(r.value)}
                        className={`no-drag py-2 rounded-md text-xs font-semibold border bg-surface-medium/40 transition-colors ${r.color}`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                className="flex flex-col items-center gap-2 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-3xl">🎉</p>
                <p className="text-slate-300 text-sm font-medium">All caught up!</p>
                <p className="text-slate-400 text-xs">{dueCount === 0 ? 'No cards due.' : `${dueCount} cards due`}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Footer: due count ── */}
        <div className="px-4 pb-3 pt-1 border-t border-white/30">
          <p className="text-[10px] text-slate-400 text-center">
            {dueCount > 0 ? `${dueCount} card${dueCount !== 1 ? 's' : ''} due` : '✓ all done'}
          </p>
        </div>
      </motion.div>
    </div>
  )
}
