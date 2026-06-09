import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { scheduleReview } from '../utils/fsrs'
import { useReviewStore, type ReviewCard } from '../stores/reviewStore'
import CardZhToEn from '../components/flashcards/CardZhToEn'
import CardEnToZh from '../components/flashcards/CardEnToZh'
import CardCloze from '../components/flashcards/CardCloze'
import SessionSummary from '../components/flashcards/SessionSummary'
import ProgressBar from '../components/ui/ProgressBar'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import type { Card, Word } from '../types/db'

function pickCardType(card: Card, allWords: Word[]): 'zh_to_en' | 'en_to_zh' | 'cloze' {
  if (card.card_type === 'cloze') return 'cloze'
  if (card.card_type === 'en_to_zh' && allWords.length >= 4) return 'en_to_zh'
  return 'zh_to_en'
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function ReviewPage() {
  const navigate = useNavigate()
  const store = useReviewStore()
  const [allWords, setAllWords] = useState<Word[]>([])
  const [cardKey, setCardKey] = useState(0)

  useEffect(() => {
    store.reset()
    Promise.all([
      window.db.cards.getDue(20),
      window.db.words.getAll(),
      window.db.cards.getMastered(5),
    ]).then(async ([dueCards, words, masteredCards]) => {
      setAllWords(words as Word[])

      const makeCard = async (card: Card, isChallenge: boolean): Promise<ReviewCard | null> => {
        const word = (words as Word[]).find((w) => w.id === card.word_id)
        return word ? { card, word, isChallenge } : null
      }

      const dueQueue = (
        await Promise.all((dueCards as Card[]).map((c) => makeCard(c, false)))
      ).filter((x): x is ReviewCard => x !== null)

      if (dueQueue.length === 0) { store.startSession([]); return }

      // Inject 1 mastered challenge per 5 due, max 3
      const challengeCount = Math.min(3, Math.floor(dueQueue.length / 5))
      const challenges = (
        await Promise.all((masteredCards as Card[]).slice(0, challengeCount).map((c) => makeCard(c, true)))
      ).filter((x): x is ReviewCard => x !== null)

      const combined = shuffle(dueQueue)
      for (let i = 0; i < challenges.length; i++) {
        const pos = Math.floor(((i + 1) * combined.length) / (challenges.length + 1))
        combined.splice(pos, 0, challenges[i])
      }

      store.startSession(combined)
    })
  }, [])

  const handleRate = useCallback(async (rating: 1 | 2 | 3 | 4) => {
    const current = store.current
    if (!current) return
    const { card, word } = current

    await window.db.reviews.create(
      { card_id: card.id, word_id: word.id, rating, time_taken_ms: 0, xp_earned: 0 },
      current.isChallenge || card.state === 'mastered'
    )

    const fsrs = scheduleReview(card, rating)
    await window.db.cards.update(card.id, {
      due: fsrs.due, state: fsrs.state, stability: fsrs.stability,
      difficulty: fsrs.difficulty, elapsed_days: fsrs.elapsed_days,
      scheduled_days: fsrs.scheduled_days, reps: fsrs.reps,
      lapses: fsrs.lapses, last_review: new Date().toISOString(),
    })

    store.submitRating(rating)
    setCardKey((k) => k + 1)
  }, [store])

  const handleRestart = useCallback(() => {
    store.reset()
    window.db.cards.getDue(20).then(async (dueCards) => {
      if ((dueCards as Card[]).length === 0) { store.startSession([]); return }
      const cards = (await Promise.all(
        (dueCards as Card[]).map(async (card) => {
          const word = allWords.find((w) => w.id === card.word_id)
          return word ? { card, word, isChallenge: false } : null
        })
      )).filter((x): x is ReviewCard => x !== null)
      store.startSession(cards)
    })
  }, [allWords, store])

  if (store.state === 'idle' || store.state === 'loading') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-ice-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading cards…</p>
        </div>
      </div>
    )
  }

  if (store.state === 'active' && !store.current) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState
          icon="🎉"
          title="All caught up!"
          description="No cards due right now. Import more content or check back later."
          actionLabel="Back to Dashboard"
          onAction={() => navigate('/dashboard')}
        />
      </div>
    )
  }

  if (store.state === 'finished') {
    return (
      <div className="flex items-center justify-center h-full">
        <SessionSummary
          correct={store.correct}
          incorrect={store.incorrect}
          total={store.totalInSession}
          onRestart={handleRestart}
          onExit={() => navigate('/dashboard')}
        />
      </div>
    )
  }

  const { card, word, isChallenge } = store.current!
  const reviewed = store.totalInSession - store.queue.length - 1
  const progress = store.totalInSession > 0 ? (reviewed / store.totalInSession) * 100 : 0
  const cardType = pickCardType(card, allWords)

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">{reviewed + 1} / {store.totalInSession}</span>
            {isChallenge && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-xp-gold/20 text-amber-600 border border-xp-gold/30">
                ⚡ Challenge
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-emerald-500">✓ {store.correct}</span>
            <span className="text-rose-400">✗ {store.incorrect}</span>
            <Button onClick={() => navigate('/dashboard')} variant="ghost" size="sm">Exit</Button>
          </div>
        </div>
        <ProgressBar value={progress} color={isChallenge ? 'gold' : 'blue'} size="sm" animated={false} />
      </div>

      <div className="flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={cardKey}
            className="w-full"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            {cardType === 'zh_to_en' && <CardZhToEn word={word} isChallenge={isChallenge} onRate={handleRate} />}
            {cardType === 'en_to_zh' && <CardEnToZh word={word} allWords={allWords} onRate={handleRate} />}
            {cardType === 'cloze' && <CardCloze word={word} isChallenge={isChallenge} onRate={handleRate} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex justify-center pb-2">
        <span className="text-xs text-slate-300 uppercase tracking-widest">
          {cardType === 'zh_to_en' ? 'Chinese → English' : cardType === 'en_to_zh' ? 'English → Chinese' : 'Fill in the blank'}
        </span>
      </div>
    </div>
  )
}
