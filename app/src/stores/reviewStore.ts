import { create } from 'zustand'
import type { Card, Word } from '../types/db'

export interface ReviewCard {
  card: Card
  word: Word
  isChallenge?: boolean
}

type SessionState = 'idle' | 'loading' | 'active' | 'finished'

interface ReviewStore {
  state: SessionState
  queue: ReviewCard[]
  current: ReviewCard | null
  correct: number
  incorrect: number
  totalInSession: number

  startSession: (cards: ReviewCard[]) => void
  submitRating: (rating: 1 | 2 | 3 | 4) => void
  reset: () => void
}

export const useReviewStore = create<ReviewStore>((set, get) => ({
  state: 'idle',
  queue: [],
  current: null,
  correct: 0,
  incorrect: 0,
  totalInSession: 0,

  startSession(cards) {
    set({
      state: 'active',
      queue: cards.slice(1),
      current: cards[0] ?? null,
      correct: 0,
      incorrect: 0,
      totalInSession: cards.length,
    })
  },

  submitRating(rating) {
    const { queue } = get()
    const next = queue[0] ?? null
    set((s) => ({
      queue: queue.slice(1),
      current: next,
      state: next ? 'active' : 'finished',
      correct: s.correct + (rating >= 3 ? 1 : 0),
      incorrect: s.incorrect + (rating < 3 ? 1 : 0),
    }))
  },

  reset() {
    set({ state: 'idle', queue: [], current: null, correct: 0, incorrect: 0, totalInSession: 0 })
  },
}))
