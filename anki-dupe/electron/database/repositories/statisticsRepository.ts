import { getDb } from '../db'
import type { Statistic } from '../schema'

export const statisticsRepository = {
  getToday(): Statistic | null {
    const today = new Date().toISOString().slice(0, 10)
    return (
      (getDb().prepare('SELECT * FROM statistics WHERE date = ?').get(today) as Statistic) ?? null
    )
  },

  getLast30Days(): Statistic[] {
    return getDb()
      .prepare(
        `SELECT * FROM statistics
         WHERE date >= date('now', '-30 days')
         ORDER BY date ASC`
      )
      .all() as Statistic[]
  },

  getTotals(): { totalReviewed: number; totalCorrect: number; totalXp: number; totalTimeMs: number } {
    const row = getDb()
      .prepare(
        `SELECT
           COALESCE(SUM(words_reviewed), 0)  as totalReviewed,
           COALESCE(SUM(words_correct), 0)   as totalCorrect,
           COALESCE(SUM(xp_earned), 0)       as totalXp,
           COALESCE(SUM(study_time_ms), 0)   as totalTimeMs
         FROM statistics`
      )
      .get() as { totalReviewed: number; totalCorrect: number; totalXp: number; totalTimeMs: number }
    return row
  },
}
