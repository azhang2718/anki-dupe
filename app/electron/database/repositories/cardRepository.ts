import { getDb } from '../db'
import type { Card } from '../schema'

export const cardRepository = {
  getDue(limit = 20): Card[] {
    return getDb()
      .prepare(
        `SELECT * FROM cards
         WHERE state != 'mastered' AND datetime(due) <= datetime('now')
         ORDER BY datetime(due) ASC LIMIT ?`
      )
      .all(limit) as Card[]
  },

  getByWordId(wordId: number): Card[] {
    return getDb().prepare('SELECT * FROM cards WHERE word_id = ?').all(wordId) as Card[]
  },

  getById(id: number): Card | null {
    return (getDb().prepare('SELECT * FROM cards WHERE id = ?').get(id) as Card) ?? null
  },

  create(card: Omit<Card, 'id' | 'created_at'>): Card {
    const result = getDb()
      .prepare(
        `INSERT INTO cards
          (word_id, card_type, state, due, stability, difficulty,
           elapsed_days, scheduled_days, reps, lapses, last_review)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        card.word_id,
        card.card_type,
        card.state,
        card.due,
        card.stability,
        card.difficulty,
        card.elapsed_days,
        card.scheduled_days,
        card.reps,
        card.lapses,
        card.last_review ?? null
      )
    return this.getById(result.lastInsertRowid as number)!
  },

  update(id: number, updates: Partial<Card>): Card {
    const fields = Object.keys(updates)
      .map((k) => `${k} = ?`)
      .join(', ')
    getDb()
      .prepare(`UPDATE cards SET ${fields} WHERE id = ?`)
      .run(...Object.values(updates), id)
    return this.getById(id)!
  },

  countDue(): number {
    return (
      getDb()
        .prepare(`SELECT COUNT(*) as c FROM cards WHERE state != 'mastered' AND datetime(due) <= datetime('now')`)
        .get() as { c: number }
    ).c
  },

  getMastered(limit = 5): Card[] {
    return getDb()
      .prepare(
        `SELECT * FROM cards
         WHERE state = 'mastered'
         ORDER BY RANDOM()
         LIMIT ?`
      )
      .all(limit) as Card[]
  },

  countByState(): Record<Card['state'], number> {
    const rows = getDb()
      .prepare('SELECT state, COUNT(*) as c FROM cards GROUP BY state')
      .all() as { state: Card['state']; c: number }[]
    const result: Record<Card['state'], number> = { new: 0, learning: 0, review: 0, mastered: 0 }
    for (const row of rows) result[row.state] = row.c
    return result
  },
}
