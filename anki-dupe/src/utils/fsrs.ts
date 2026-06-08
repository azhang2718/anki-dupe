/**
 * FSRS-4.5 implementation
 *
 * Based on the Free Spaced Repetition Scheduler paper by Jarrett Ye.
 * https://github.com/open-spaced-repetition/fsrs4anki
 *
 * Stability (S): days until 90% retention
 * Difficulty (D): 1–10, higher = harder
 * Retrievability (R): probability of recall at review time
 */

// Default FSRS-4.5 weights (from open-source training data)
const W = [
  0.4072, 1.1829, 3.1262, 15.4722,
  7.2102, 0.5316, 1.0651, 0.0589,
  1.5330, 0.1544, 1.0070,
  1.9395, 0.1100, 0.2900, 2.2700,
  0.2700, 2.9898, 0.5100, 0.3400,
]

// Forgetting curve constants
const DECAY  = -0.5
const FACTOR = Math.pow(0.9, 1 / DECAY) - 1  // ≈ 0.2344 (= 19/81)

export type Rating = 1 | 2 | 3 | 4  // 1=Again 2=Hard 3=Good 4=Easy

export interface FSRSCard {
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  reps: number
  lapses: number
  state: 'new' | 'learning' | 'review' | 'mastered'
  last_review: string | null
}

export interface FSRSResult {
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  reps: number
  lapses: number
  state: FSRSCard['state']
  due: string
}

// ── Core formulas ────────────────────────────────────────────────────────────

function retrievability(elapsedDays: number, stability: number): number {
  return Math.pow(1 + FACTOR * elapsedDays / stability, DECAY)
}

function initialDifficulty(rating: Rating): number {
  return clamp(W[4] - Math.exp(W[5] * (rating - 1)) + 1, 1, 10)
}

function initialStability(rating: Rating): number {
  return Math.max(0.1, W[rating - 1])
}

function nextDifficulty(D: number, rating: Rating): number {
  const delta = D - W[6] * (rating - 3)
  // Mean-reversion toward initial difficulty of rating 3
  const reverted = W[7] * initialDifficulty(3) + (1 - W[7]) * delta
  return clamp(reverted, 1, 10)
}

function nextStabilityAfterRecall(D: number, S: number, R: number, rating: Rating): number {
  const hardPenalty = rating === 2 ? W[15] : 1
  const easyBonus   = rating === 4 ? W[16] : 1
  return S * (
    Math.exp(W[8]) *
    (11 - D) *
    Math.pow(S, -W[9]) *
    (Math.exp(W[10] * (1 - R)) - 1) *
    hardPenalty *
    easyBonus +
    1
  )
}

function nextStabilityAfterForgetting(D: number, S: number, R: number): number {
  return (
    W[11] *
    Math.pow(D, -W[12]) *
    (Math.pow(S + 1, W[13]) - 1) *
    Math.exp(W[14] * (1 - R))
  )
}

function intervalFromStability(S: number, requestedRetention = 0.9): number {
  return Math.max(1, Math.round(
    (S / FACTOR) * (Math.pow(requestedRetention, 1 / DECAY) - 1)
  ))
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Compute the next FSRS state for a card after a review.
 */
export function scheduleReview(card: FSRSCard, rating: Rating, now = new Date()): FSRSResult {
  const elapsedDays = card.last_review
    ? Math.max(0, Math.round((now.getTime() - new Date(card.last_review).getTime()) / 86400000))
    : 0

  let { stability, difficulty } = card
  let lapses = card.lapses
  let intervalDays: number

  if (card.state === 'new') {
    // First review — initialise from rating
    stability  = initialStability(rating)
    difficulty = initialDifficulty(rating)

    if (rating === 1) {
      // Again on a new card: short relearning step
      intervalDays = 1
    } else {
      intervalDays = intervalFromStability(stability)
    }
  } else {
    const R = retrievability(elapsedDays, stability)

    if (rating === 1) {
      // Lapse
      lapses++
      stability  = nextStabilityAfterForgetting(difficulty, stability, R)
      difficulty = nextDifficulty(difficulty, rating)
      intervalDays = 1
    } else {
      stability  = nextStabilityAfterRecall(difficulty, stability, R, rating)
      difficulty = nextDifficulty(difficulty, rating)
      intervalDays = intervalFromStability(stability)
    }
  }

  // Determine new card state
  const reps = card.reps + 1
  let state: FSRSCard['state']
  if (rating === 1) {
    state = 'learning'
  } else if (reps >= 4 && intervalDays >= 21) {
    state = 'mastered'
  } else if (intervalDays >= 1) {
    state = 'review'
  } else {
    state = 'learning'
  }

  const due = new Date(now.getTime() + intervalDays * 86400000).toISOString()

  return {
    stability:      Math.max(0.1, stability),
    difficulty:     clamp(difficulty, 1, 10),
    elapsed_days:   elapsedDays,
    scheduled_days: intervalDays,
    reps,
    lapses,
    state,
    due,
  }
}

/**
 * Create a fresh set of cards for a new word.
 * Returns one zh_to_en card; additional card types added as the word matures.
 */
export function createInitialCards(wordId: number): Omit<import('../types/db').Card, 'id' | 'created_at'>[] {
  const due = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const base = {
    word_id:        wordId,
    state:          'new' as const,
    due,
    stability:      0,
    difficulty:     5,
    elapsed_days:   0,
    scheduled_days: 0,
    reps:           0,
    lapses:         0,
    last_review:    null,
  }
  return [
    { ...base, card_type: 'zh_to_en' },
  ]
}
