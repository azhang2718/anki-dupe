import { ipcMain } from 'electron'
import { getDb } from '../database/db'
import { createInitialCards } from '../utils/fsrs'
import { checkAchievements } from '../services/achievementChecker'
import { userRepository } from '../database/repositories/userRepository'
import { wordRepository } from '../database/repositories/wordRepository'
import { cardRepository } from '../database/repositories/cardRepository'
import { reviewRepository } from '../database/repositories/reviewRepository'
import { achievementRepository } from '../database/repositories/achievementRepository'
import { documentRepository } from '../database/repositories/documentRepository'
import { settingsRepository } from '../database/repositories/settingsRepository'
import { statisticsRepository } from '../database/repositories/statisticsRepository'

function handle(channel: string, fn: (...args: unknown[]) => unknown) {
  ipcMain.handle(channel, (_event, ...args) => {
    try {
      return { ok: true, data: fn(...args) }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  })
}

export function registerDbHandlers(): void {
  // User
  handle('db:user:get', () => userRepository.get())
  handle('db:user:addXp', (amount, reason) => userRepository.addXp(amount as number, reason as string))
  handle('db:user:updateStreak', () => userRepository.updateStreak())
  handle('db:user:updateDailyGoal', (goal) => userRepository.updateDailyGoal(goal as number))

  // Words
  handle('db:words:getAll', () => wordRepository.getAll())
  handle('db:words:getById', (id) => wordRepository.getById(id as number))
  handle('db:words:delete', (id) => wordRepository.delete(id as number))
  handle('db:words:upsert', (word) => wordRepository.upsert(word as Parameters<typeof wordRepository.upsert>[0]))
  handle('db:words:count', () => wordRepository.count())
  handle('db:words:getTopByImportance', (limit) => wordRepository.getTopByImportance(limit as number))

  // Upsert a word and atomically create its initial FSRS cards if new
  handle('db:words:upsertWithCards', (word) => {
    const db = getDb()
    const w = word as Parameters<typeof wordRepository.upsert>[0]
    return db.transaction(() => {
      const saved = wordRepository.upsert(w)
      // Only create cards if this word has none yet
      const existingCards = db
        .prepare('SELECT id FROM cards WHERE word_id = ?')
        .all(saved.id)
      if (existingCards.length === 0) {
        const initialCards = createInitialCards(saved.id)
        for (const card of initialCards) {
          db.prepare(
            `INSERT INTO cards
              (word_id, card_type, state, due, stability, difficulty,
               elapsed_days, scheduled_days, reps, lapses, last_review)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).run(
            card.word_id, card.card_type, card.state, card.due,
            card.stability, card.difficulty, card.elapsed_days,
            card.scheduled_days, card.reps, card.lapses, card.last_review
          )
        }
      }
      return saved
    })()
  })

  // Cards
  handle('db:cards:getDue', (limit) => cardRepository.getDue(limit as number))
  handle('db:cards:getById', (id) => cardRepository.getById(id as number))
  handle('db:cards:getByWordId', (wordId) => cardRepository.getByWordId(wordId as number))
  handle('db:cards:create', (card) => cardRepository.create(card as Parameters<typeof cardRepository.create>[0]))
  handle('db:cards:update', (id, updates) => cardRepository.update(id as number, updates as Parameters<typeof cardRepository.update>[1]))
  handle('db:cards:countDue', () => cardRepository.countDue())
  handle('db:cards:countByState', () => cardRepository.countByState())

  // Reviews
  handle('db:reviews:create', (review) => reviewRepository.create(review as Parameters<typeof reviewRepository.create>[0]))
  handle('db:reviews:getRecent', (limit) => reviewRepository.getRecent(limit as number))
  handle('db:reviews:getAccuracy7d', () => reviewRepository.getAccuracyLast7Days())

  // Achievements
  handle('db:achievements:getAll', () => achievementRepository.getAll())
  handle('db:achievements:getUnlocked', () => achievementRepository.getUnlocked())
  handle('db:achievements:unlock', (key) => achievementRepository.unlock(key as string))

  // Documents
  handle('db:documents:getAll', () => documentRepository.getAll())
  handle('db:documents:getById', (id) => documentRepository.getById(id as number))
  handle('db:documents:create', (doc) => documentRepository.create(doc as Parameters<typeof documentRepository.create>[0]))
  handle('db:documents:updateStatus', (id, status, rawText) =>
    documentRepository.updateStatus(id as number, status as Parameters<typeof documentRepository.updateStatus>[1], rawText as string | undefined)
  )

  // Settings
  handle('db:settings:get', (key) => settingsRepository.get(key as string))
  handle('db:settings:set', (key, value) => settingsRepository.set(key as string, value as string))
  handle('db:settings:getAll', () => settingsRepository.getAll())

  // Gamification
  handle('db:achievements:check', (ctx) => checkAchievements(ctx as Parameters<typeof checkAchievements>[0]))

  // Statistics
  handle('db:stats:getToday', () => statisticsRepository.getToday())
  handle('db:stats:getLast30Days', () => statisticsRepository.getLast30Days())
  handle('db:stats:getTotals', () => statisticsRepository.getTotals())

  // Backup & Restoration
  handle('db:exportFull', () => {
    const { exportFullBackup } = require('../utils/backup')
    return exportFullBackup()
  })

  handle('db:importFull', (data) => {
    const { importFullBackup } = require('../utils/backup')
    importFullBackup(data)
    return { ok: true }
  })

  // Vocabulary intelligence
  handle('db:words:getEnriched', () => {
    const db = getDb()
    return db.prepare(`
      SELECT
        w.*,
        COALESCE(cs.best_state, 'new')             AS card_state,
        COALESCE(cs.next_due, datetime('now'))      AS next_due,
        COALESCE(rs.total_reviews, 0)               AS total_reviews,
        COALESCE(rs.correct_reviews, 0)             AS correct_reviews
      FROM words w
      LEFT JOIN (
        SELECT word_id,
               MAX(CASE state WHEN 'mastered' THEN 4 WHEN 'review' THEN 3
                              WHEN 'learning' THEN 2 ELSE 1 END) AS state_rank,
               CASE MAX(CASE state WHEN 'mastered' THEN 4 WHEN 'review' THEN 3
                                   WHEN 'learning' THEN 2 ELSE 1 END)
                 WHEN 4 THEN 'mastered' WHEN 3 THEN 'review'
                 WHEN 2 THEN 'learning' ELSE 'new' END AS best_state,
               MIN(due) AS next_due
        FROM cards
        GROUP BY word_id
      ) cs ON cs.word_id = w.id
      LEFT JOIN (
        SELECT c.word_id,
               COUNT(r.id)                                     AS total_reviews,
               SUM(CASE WHEN r.rating >= 3 THEN 1 ELSE 0 END) AS correct_reviews
        FROM reviews r
        JOIN cards c ON c.id = r.card_id
        GROUP BY c.word_id
      ) rs ON rs.word_id = w.id
      ORDER BY w.importance_score DESC
    `).all()
  })

  handle('db:words:recalculateImportance', () => {
    const { recalculateImportanceScores } = require('../services/importanceService')
    return { updated: recalculateImportanceScores() }
  })

  // Knowledge graph data
  handle('db:words:getGraphData', () => {
    const db = getDb()

    interface WordRow {
      id: number; chinese: string; pinyin: string; meaning: string
      difficulty: number; importance_score: number; source_document_id: number | null
      best_state: string
    }
    interface DocRow { id: number; title: string }

    const words = db.prepare(`
      SELECT w.id, w.chinese, w.pinyin, w.meaning, w.difficulty, w.importance_score,
             w.source_document_id,
             COALESCE(
               CASE MAX(CASE c.state WHEN 'mastered' THEN 4 WHEN 'review' THEN 3
                                     WHEN 'learning' THEN 2 ELSE 1 END)
                 WHEN 4 THEN 'mastered' WHEN 3 THEN 'review'
                 WHEN 2 THEN 'learning' ELSE 'new' END, 'new') AS best_state
      FROM words w LEFT JOIN cards c ON c.word_id = w.id
      GROUP BY w.id
      ORDER BY w.importance_score DESC
      LIMIT 120
    `).all() as WordRow[]

    const docIds = [...new Set(words.map((w) => w.source_document_id).filter(Boolean))]
    const docs = docIds.length
      ? db.prepare(`SELECT id, title FROM documents WHERE id IN (${docIds.join(',')})`)
          .all() as DocRow[]
      : []

    // Build edges: word → source doc
    const edges: { source: string; target: string; type: 'doc' | 'char' }[] = []
    for (const w of words) {
      if (w.source_document_id) {
        edges.push({ source: `doc-${w.source_document_id}`, target: `word-${w.id}`, type: 'doc' })
      }
    }

    // Build character-sharing edges (only for words with 2+ chars; limit to top-importance pairs)
    const top60 = words.slice(0, 60)
    for (let i = 0; i < top60.length; i++) {
      for (let j = i + 1; j < top60.length; j++) {
        const a = top60[i]; const b = top60[j]
        if (a.chinese.length < 2 || b.chinese.length < 2) continue
        const shared = [...a.chinese].some((ch) => b.chinese.includes(ch))
        if (shared) {
          edges.push({ source: `word-${a.id}`, target: `word-${b.id}`, type: 'char' })
        }
      }
    }

    return { words, docs, edges }
  })

  // Reading readiness
  handle('db:documents:analyzeReadiness', (docId: number) => {
    const { analyzeReadiness } = require('../services/readingReadinessService')
    return analyzeReadiness(docId)
  })
}
