import { getDb } from '../db'
import type { Review } from '../schema'

export const reviewRepository = {
  create(review: Omit<Review, 'id' | 'reviewed_at'>): Review {
    const db = getDb()
    const result = db
      .prepare(
        `INSERT INTO reviews (card_id, word_id, rating, time_taken_ms, xp_earned)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(review.card_id, review.word_id, review.rating, review.time_taken_ms, review.xp_earned)

    // Update today's statistics
    const today = new Date().toISOString().slice(0, 10)
    db.prepare(
      `INSERT INTO statistics (date, words_reviewed, words_correct, xp_earned, study_time_ms)
       VALUES (?, 1, ?, ?, ?)
       ON CONFLICT(date) DO UPDATE SET
         words_reviewed = words_reviewed + 1,
         words_correct  = words_correct  + ?,
         xp_earned      = xp_earned      + ?,
         study_time_ms  = study_time_ms  + ?`
    ).run(
      today,
      review.rating >= 3 ? 1 : 0,
      review.xp_earned,
      review.time_taken_ms,
      review.rating >= 3 ? 1 : 0,
      review.xp_earned,
      review.time_taken_ms
    )

    return db
      .prepare('SELECT * FROM reviews WHERE id = ?')
      .get(result.lastInsertRowid) as Review
  },

  getRecent(limit = 50): Review[] {
    return getDb()
      .prepare('SELECT * FROM reviews ORDER BY reviewed_at DESC LIMIT ?')
      .all(limit) as Review[]
  },

  getAccuracyLast7Days(): number {
    const since = new Date(Date.now() - 7 * 86400000).toISOString()
    const row = getDb()
      .prepare(
        `SELECT
           COUNT(*) as total,
           SUM(CASE WHEN rating >= 3 THEN 1 ELSE 0 END) as correct
         FROM reviews WHERE reviewed_at >= ?`
      )
      .get(since) as { total: number; correct: number }
    if (!row.total) return 0
    return Math.round((row.correct / row.total) * 100)
  },
}
