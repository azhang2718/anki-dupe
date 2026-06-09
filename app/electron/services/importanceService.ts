import { getDb } from '../database/db'

/**
 * Recalculates importance_score for all words using:
 *   - frequency_score (from Claude, 1–100) — how common this word is in Chinese
 *   - difficulty       (1–5) — words in the sweet spot (2–3) score highest
 *   - doc_count        — words seen across multiple documents
 *   - accuracy_factor  — words with low review accuracy need more attention (higher priority)
 *
 * Final score is clamped 1–100.
 */
export function recalculateImportanceScores(): number {
  const db = getDb()

  interface WordRow {
    id: number
    frequency_score: number
    difficulty: number
  }

  interface ReviewStats {
    word_id: number
    total: number
    correct: number
  }

  interface DocCount {
    word_id: number
    doc_count: number
  }

  const words = db.prepare('SELECT id, frequency_score, difficulty FROM words').all() as WordRow[]
  if (!words.length) return 0

  // Aggregate review accuracy per word (via cards)
  const reviewStats = db.prepare(`
    SELECT c.word_id,
           COUNT(r.id)                                    AS total,
           SUM(CASE WHEN r.rating >= 3 THEN 1 ELSE 0 END) AS correct
    FROM reviews r
    JOIN cards c ON c.id = r.card_id
    GROUP BY c.word_id
  `).all() as ReviewStats[]

  const statsMap = new Map(reviewStats.map((s) => [s.word_id, s]))

  // Count how many distinct documents reference each word
  const docCounts = db.prepare(`
    SELECT source_document_id AS word_id, COUNT(*) AS doc_count
    FROM words
    WHERE source_document_id IS NOT NULL
    GROUP BY source_document_id
  `).all() as DocCount[]

  const docMap = new Map(docCounts.map((d) => [d.word_id, d.doc_count]))

  const update = db.prepare('UPDATE words SET importance_score = ? WHERE id = ?')

  const updateAll = db.transaction(() => {
    for (const w of words) {
      const freq = w.frequency_score ?? 50
      const diff = w.difficulty ?? 3

      // Difficulty sweet-spot bonus: peaks at difficulty 2, tapers off toward 1 and 5
      const diffBonus = Math.max(0, 15 - Math.abs(diff - 2) * 5)

      // Doc occurrence bonus (capped)
      const docBonus = Math.min((docMap.get(w.id) ?? 0) * 3, 15)

      // Review struggle bonus: if accuracy < 60%, add up to 20 points
      const stats = statsMap.get(w.id)
      let struggleBonus = 0
      if (stats && stats.total >= 3) {
        const accuracy = stats.correct / stats.total
        if (accuracy < 0.6) struggleBonus = Math.round((0.6 - accuracy) * 50)
      }

      const raw = freq * 0.5 + diffBonus + docBonus + struggleBonus
      const score = Math.min(100, Math.max(1, Math.round(raw)))

      update.run(score, w.id)
    }
  })

  updateAll()
  return words.length
}
