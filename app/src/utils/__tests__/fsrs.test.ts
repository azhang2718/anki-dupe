import { describe, it, expect } from 'vitest'
import { scheduleReview, createInitialCards } from '../fsrs'
import type { FSRSCard } from '../fsrs'

const newCard: FSRSCard = {
  stability: 0,
  difficulty: 5,
  elapsed_days: 0,
  scheduled_days: 0,
  reps: 0,
  lapses: 0,
  state: 'new',
  last_review: null,
}

describe('FSRS scheduleReview', () => {
  it('new card with Easy rating gets long interval', () => {
    const result = scheduleReview(newCard, 4)
    expect(result.state).toBe('review')
    expect(result.scheduled_days).toBeGreaterThan(5)
    expect(result.stability).toBeGreaterThan(5)
    expect(result.reps).toBe(1)
  })

  it('new card with Again rating goes to learning', () => {
    const result = scheduleReview(newCard, 1)
    expect(result.state).toBe('learning')
    expect(result.scheduled_days).toBe(1)
    // New cards don't count as lapses — lapses only apply to previously-known cards
    expect(result.lapses).toBe(0)
  })

  it('new card with Good rating gets moderate interval', () => {
    const result = scheduleReview(newCard, 3)
    expect(result.state).toBe('review')
    expect(result.scheduled_days).toBeGreaterThanOrEqual(1)
  })

  it('lapse on review card increases lapses and resets interval', () => {
    const reviewCard: FSRSCard = {
      ...newCard,
      state: 'review',
      stability: 20,
      difficulty: 5,
      reps: 4,
      last_review: new Date(Date.now() - 10 * 86400000).toISOString(),
    }
    const result = scheduleReview(reviewCard, 1)
    expect(result.lapses).toBe(1)
    expect(result.scheduled_days).toBe(1)
    expect(result.state).toBe('learning')
  })

  it('mature card with Easy reaches mastered state', () => {
    let card: FSRSCard = { ...newCard }
    // Simulate reviews with realistic elapsed time so stability grows each round
    let dayOffset = 0
    for (let i = 0; i < 5; i++) {
      const lastReview = new Date(Date.now() - dayOffset * 86400000).toISOString()
      card = { ...card, state: card.state === 'new' ? 'new' : 'review', last_review: lastReview }
      const result = scheduleReview(card, 4)
      dayOffset += result.scheduled_days
      card = { ...card, ...result }
    }
    expect(card.state).toBe('mastered')
    expect(card.reps).toBe(5)
  })

  it('difficulty increases on Hard rating', () => {
    const card: FSRSCard = { ...newCard, state: 'review', stability: 5, reps: 2, last_review: new Date(Date.now() - 5 * 86400000).toISOString() }
    const good = scheduleReview(card, 3)
    const hard = scheduleReview(card, 2)
    expect(hard.difficulty).toBeGreaterThanOrEqual(good.difficulty)
  })

  it('due date is in the future', () => {
    const result = scheduleReview(newCard, 3)
    expect(new Date(result.due).getTime()).toBeGreaterThan(Date.now())
  })

  it('stability is always positive', () => {
    for (const rating of [1, 2, 3, 4] as const) {
      const result = scheduleReview(newCard, rating)
      expect(result.stability).toBeGreaterThan(0)
    }
  })

  it('difficulty stays in 1–10 range', () => {
    let card: FSRSCard = { ...newCard }
    // Hammer with Again to push difficulty high
    for (let i = 0; i < 20; i++) {
      card = { ...card, ...scheduleReview(card, 1), last_review: new Date().toISOString() }
    }
    expect(card.difficulty).toBeLessThanOrEqual(10)
    expect(card.difficulty).toBeGreaterThanOrEqual(1)
  })
})

describe('createInitialCards', () => {
  it('creates one zh_to_en card per new word', () => {
    const cards = createInitialCards(42)
    expect(cards).toHaveLength(1)
    expect(cards[0].card_type).toBe('zh_to_en')
    expect(cards[0].word_id).toBe(42)
    expect(cards[0].state).toBe('new')
    expect(cards[0].reps).toBe(0)
  })
})
