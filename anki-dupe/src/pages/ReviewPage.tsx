import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { scheduleReview } from '../utils/fsrs'
import { useReviewStore, type ReviewCard } from '../stores/reviewStore'
import { useGamificationStore } from '../stores/gamificationStore'
import CardZhToEn from '../components/flashcards/CardZhToEn'
import CardEnToZh from '../components/flashcards/CardEnToZh'
import CardCloze from '../components/flashcards/CardCloze'
import SessionSummary from '../components/flashcards/SessionSummary'
import ProgressBar from '../components/ui/ProgressBar'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import type { Card, Word } from '../types/db'

const XP_TABLE: Record<number, number> = { 1: 5, 2: 20, 3: 10, 4: 10 }

function pickCardType(card: Card, allWords: Word[]): 'zh_to_en' | 'en_to_zh' | 'cloze' {
  if (card.card_type === 'cloze') return 'cloze'
  if (card.card_type === 'en_to_zh' && allWords.length >= 4) return 'en_to_zh'
  return 'zh_to_en'
}

export default function ReviewPage() {
  const navigate = useNavigate()
  const store = useReviewStore()
  const gamification = useGamificationStore()
  const prevLevelRef = useRef<number | null>(null)
  const [allWords, setAllWords] = useState<Word[]>([])
  const [cardKey, setCardKey] = useState(0)

  // Load session on mount (always reset — zustand state persists across route changes)
  useEffect(() => {
    store.reset()
    Promise.all([
      window.db.cards.getDue(20),
      window.db.words.getAll(),
    ]).then(async ([dueCards, words]) => {
      setAllWords(words)
      if (dueCards.length === 0) {
        store.startSession([])
        return
      }
      const reviewCards: ReviewCard[] = await Promise.all(
        dueCards.map(async (card) => {
          const word = words.find((w) => w.id === card.word_id)
          if (!word) return null
          return { card, word }
        }).filter(Boolean) as Promise<ReviewCard>[]
      )
      store.startSession(reviewCards.filter(Boolean))
    })
  }, [])

  const handleRate = useCallback(async (rating: 1 | 2 | 3 | 4) => {
    const current = store.current
    if (!current) return

    const xp = XP_TABLE[rating]

    // Persist review to DB
    await window.db.reviews.create({
      card_id: current.card.id,
      word_id: current.word.id,
      rating,
      time_taken_ms: 0,
      xp_earned: xp,
    })

    // FSRS-4.5 scheduling
    const fsrsResult = scheduleReview(current.card, rating)

    await window.db.cards.update(current.card.id, {
      due:            fsrsResult.due,
      state:          fsrsResult.state,
      stability:      fsrsResult.stability,
      difficulty:     fsrsResult.difficulty,
      elapsed_days:   fsrsResult.elapsed_days,
      scheduled_days: fsrsResult.scheduled_days,
      reps:           fsrsResult.reps,
      lapses:         fsrsResult.lapses,
      last_review:    new Date().toISOString(),
    })

    const updatedUser = await window.db.user.addXp(xp, `review_${rating}`)

    // Level-up detection
    if (prevLevelRef.current !== null && updatedUser.level > prevLevelRef.current) {
      gamification.showLevelUp(updatedUser.level)
    }
    prevLevelRef.current = updatedUser.level

    // Achievement checks
    const newAchievements = await window.db.achievements.check()
    gamification.enqueueAchievements(newAchievements)

    store.submitRating(rating, xp)

    // Check perfect session when last card is rated
    const updatedStore = useReviewStore.getState()
    if (updatedStore.state === 'finished' && updatedStore.incorrect === 0) {
      const perfectAchievements = await window.db.achievements.check({ sessionPerfect: true })
      gamification.enqueueAchievements(perfectAchievements)
    }

    setCardKey((k) => k + 1)
  }, [store])

  const handleRestart = useCallback(() => {
    store.reset()
    // Re-trigger load via state change
    window.db.cards.getDue(20).then(async (dueCards) => {
      if (dueCards.length === 0) { store.startSession([]); return }
      const reviewCards: ReviewCard[] = (await Promise.all(
        dueCards.map(async (card) => {
          const word = allWords.find((w) => w.id === card.word_id)
          return word ? { card, word } : null
        })
      )).filter(Boolean) as ReviewCard[]
      store.startSession(reviewCards)
    })
  }, [allWords, store])

  // Loading
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

  // No cards due
  if (store.state === 'active' && !store.current) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState
          icon="🎉"
          title="All caught up!"
          description="You have no cards due right now. Import more content or check back later."
          actionLabel="Back to Dashboard"
          onAction={() => navigate('/dashboard')}
        />
      </div>
    )
  }

  // Session finished
  if (store.state === 'finished') {
    return (
      <div className="flex items-center justify-center h-full">
        <SessionSummary
          correct={store.correct}
          incorrect={store.incorrect}
          xpEarned={store.sessionXp}
          onRestart={handleRestart}
          onExit={() => navigate('/dashboard')}
        />
      </div>
    )
  }

  const { card, word } = store.current!
  const reviewed = store.totalInSession - store.queue.length - 1
  const progress = store.totalInSession > 0 ? (reviewed / store.totalInSession) * 100 : 0
  const cardType = pickCardType(card, allWords)

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Progress header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 font-medium">
            {reviewed + 1} / {store.totalInSession}
          </span>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-emerald-500">✓ {store.correct}</span>
            <span className="text-rose-400">✗ {store.incorrect}</span>
            <Button onClick={() => navigate('/dashboard')} variant="ghost" size="sm">
              Exit
            </Button>
          </div>
        </div>
        <ProgressBar value={progress} color="blue" size="sm" animated={false} />
      </div>

      {/* Card area */}
      <div className="flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={cardKey}
            className="w-full"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {cardType === 'zh_to_en' && (
              <CardZhToEn word={word} onRate={handleRate} />
            )}
            {cardType === 'en_to_zh' && (
              <CardEnToZh word={word} allWords={allWords} onRate={handleRate} />
            )}
            {cardType === 'cloze' && (
              <CardCloze word={word} onRate={handleRate} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Card type badge */}
      <div className="flex justify-center pb-2">
        <span className="text-xs text-slate-300 uppercase tracking-widest">
          {cardType === 'zh_to_en' ? 'Chinese → English' : cardType === 'en_to_zh' ? 'English → Chinese' : 'Fill in the blank'}
        </span>
      </div>
    </div>
  )
}
