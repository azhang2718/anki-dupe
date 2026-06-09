import { ipcMain } from 'electron'
import { getDb, getDbForLanguage, getActiveLanguage, switchLanguage } from '../database/db'
import { createInitialCards } from '../utils/fsrs'
import { checkAchievements } from '../services/achievementChecker'
import { recalculateImportanceScores } from '../services/importanceService'
import { analyzeReadiness } from '../services/readingReadinessService'
import { exportFullBackup, importFullBackup } from '../utils/backup'
import { userRepository } from '../database/repositories/userRepository'
import { wordRepository } from '../database/repositories/wordRepository'
import { cardRepository } from '../database/repositories/cardRepository'
import { reviewRepository } from '../database/repositories/reviewRepository'
import { achievementRepository } from '../database/repositories/achievementRepository'
import { documentRepository } from '../database/repositories/documentRepository'
import { settingsRepository } from '../database/repositories/settingsRepository'
import { statisticsRepository } from '../database/repositories/statisticsRepository'
import { LANGUAGE_CODES, type LanguageCode } from '../database/languages'
import { isValidScript } from '../utils/scriptValidator'

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
  // ─── Language ──────────────────────────────────────────────────────────────
  handle('db:language:get', () => getActiveLanguage())

  handle('db:language:set', (lang) => {
    switchLanguage(lang as LanguageCode)
    return lang
  })

  // Cross-language word learning history for statistics
  handle('db:stats:getAllLanguagesHistory', () => {
    const result: Record<string, { newPerDay: { date: string; count: number }[]; masteredPerDay: { date: string; count: number }[] }> = {}

    for (const lang of LANGUAGE_CODES) {
      try {
        const db = getDbForLanguage(lang)
        const newPerDay = db.prepare(`
          SELECT date(min_review) as date, COUNT(*) as count
          FROM (SELECT word_id, MIN(reviewed_at) as min_review FROM reviews GROUP BY word_id)
          GROUP BY date(min_review)
          ORDER BY date ASC
        `).all() as { date: string; count: number }[]

        const masteredPerDay = db.prepare(`
          SELECT date(last_review) as date, COUNT(DISTINCT word_id) as count
          FROM cards
          WHERE state = 'mastered' AND last_review IS NOT NULL
          GROUP BY date(last_review)
          ORDER BY date ASC
        `).all() as { date: string; count: number }[]

        result[lang] = { newPerDay, masteredPerDay }
      } catch {
        result[lang] = { newPerDay: [], masteredPerDay: [] }
      }
    }

    return result
  })

  // ─── User ──────────────────────────────────────────────────────────────────
  handle('db:user:get', () => userRepository.get())
  handle('db:user:addXp', (amount, reason) => userRepository.addXp(amount as number, reason as string))
  handle('db:user:updateStreak', () => userRepository.updateStreak())
  handle('db:user:updateDailyGoal', (goal) => userRepository.updateDailyGoal(goal as number))

  // ─── Words ─────────────────────────────────────────────────────────────────
  handle('db:words:getAll', () => wordRepository.getAll())
  handle('db:words:getByChinese', (chinese) => wordRepository.getByChinese(chinese as string))
  handle('db:words:getById', (id) => wordRepository.getById(id as number))
  handle('db:words:delete', (id) => wordRepository.delete(id as number))
  handle('db:words:upsert', (word) => wordRepository.upsert(word as Parameters<typeof wordRepository.upsert>[0]))
  handle('db:words:count', () => wordRepository.count())
  handle('db:words:countLearned', () => wordRepository.countLearned())
  handle('db:words:getTopByImportance', (limit) => wordRepository.getTopByImportance(limit as number))

  // Delete a batch of word IDs (and their cards/reviews via cascade or explicit delete)
  handle('db:words:deleteMany', (ids) => {
    const db = getDb()
    const list = ids as number[]
    return db.transaction(() => {
      const delCards   = db.prepare('DELETE FROM cards   WHERE word_id = ?')
      const delReviews = db.prepare(`
        DELETE FROM reviews WHERE card_id IN (SELECT id FROM cards WHERE word_id = ?)
      `)
      const delWord    = db.prepare('DELETE FROM words   WHERE id = ?')
      for (const id of list) {
        // reviews must go before cards (FK)
        db.prepare('DELETE FROM reviews WHERE card_id IN (SELECT id FROM cards WHERE word_id = ?)').run(id)
        delCards.run(id)
        delWord.run(id)
      }
      return list.length
    })()
  })

  // Return IDs of words whose script doesn't match the active language
  handle('db:words:findInvalidScript', () => {
    const lang = getActiveLanguage()
    const words = wordRepository.getAll() as { id: number; chinese: string }[]
    return words
      .filter((w) => !isValidScript(w.chinese, lang))
      .map((w) => w.id)
  })

  handle('db:words:upsertWithCards', (word) => {
    const db = getDb()
    const w = word as Parameters<typeof wordRepository.upsert>[0]
    return db.transaction(() => {
      const saved = wordRepository.upsert(w)
      const existingCards = db.prepare('SELECT id FROM cards WHERE word_id = ?').all(saved.id)
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

  // ─── Cards ─────────────────────────────────────────────────────────────────
  handle('db:cards:getDue', (limit) => cardRepository.getDue(limit as number))
  handle('db:cards:getById', (id) => cardRepository.getById(id as number))
  handle('db:cards:getByWordId', (wordId) => cardRepository.getByWordId(wordId as number))
  handle('db:cards:create', (card) => cardRepository.create(card as Parameters<typeof cardRepository.create>[0]))
  handle('db:cards:update', (id, updates) => cardRepository.update(id as number, updates as Parameters<typeof cardRepository.update>[1]))
  handle('db:cards:countDue', () => cardRepository.countDue())
  handle('db:cards:countByState', () => cardRepository.countByState())
  handle('db:cards:getMastered', (limit) => cardRepository.getMastered(limit as number | undefined))

  // ─── Reviews ───────────────────────────────────────────────────────────────
  handle('db:reviews:create', (review, isMastered) =>
    reviewRepository.create(
      review as Parameters<typeof reviewRepository.create>[0],
      (isMastered as boolean | undefined) ?? false
    )
  )
  handle('db:user:deductXp', (amount, reason) => {
    const db = getDb()
    db.prepare('UPDATE users SET total_xp = MAX(0, total_xp - ?) WHERE id = 1').run(amount as number)
    db.prepare('INSERT INTO xp_log (amount, reason) VALUES (?, ?)').run(-(amount as number), reason as string)
    return userRepository.get()
  })
  handle('db:reviews:getRecent', (limit) => reviewRepository.getRecent(limit as number))
  handle('db:reviews:getAccuracy7d', () => reviewRepository.getAccuracyLast7Days())

  // ─── Achievements ──────────────────────────────────────────────────────────
  handle('db:achievements:getAll', () => achievementRepository.getAll())
  handle('db:achievements:getUnlocked', () => achievementRepository.getUnlocked())
  handle('db:achievements:unlock', (key) => achievementRepository.unlock(key as string))

  // ─── Documents ─────────────────────────────────────────────────────────────
  handle('db:documents:delete', (id) => documentRepository.delete(id as number))
  handle('db:documents:getAll', () => documentRepository.getAll())
  handle('db:documents:getById', (id) => documentRepository.getById(id as number))
  handle('db:documents:create', (doc) => documentRepository.create(doc as Parameters<typeof documentRepository.create>[0]))
  handle('db:documents:updateStatus', (id, status, rawText) =>
    documentRepository.updateStatus(id as number, status as Parameters<typeof documentRepository.updateStatus>[1], rawText as string | undefined)
  )

  // ─── Settings (now global, language-independent) ───────────────────────────
  handle('db:settings:get', (key) => settingsRepository.get(key as string))
  handle('db:settings:set', (key, value) => settingsRepository.set(key as string, value as string))
  handle('db:settings:getAll', () => settingsRepository.getAll())

  // ─── Gamification ──────────────────────────────────────────────────────────
  handle('db:achievements:check', (ctx) => checkAchievements(ctx as Parameters<typeof checkAchievements>[0]))

  // ─── Statistics ────────────────────────────────────────────────────────────
  handle('db:stats:getToday', () => statisticsRepository.getToday())
  handle('db:stats:getLast30Days', () => statisticsRepository.getLast30Days())
  handle('db:stats:getTotals', () => statisticsRepository.getTotals())

  // ─── Backup & Restore ──────────────────────────────────────────────────────
  handle('db:exportFull', () => exportFullBackup())
  handle('db:importFull', (data) => { importFullBackup(data); return { ok: true } })

  // ─── Vocabulary intelligence ───────────────────────────────────────────────
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
        FROM cards GROUP BY word_id
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

  handle('db:words:recalculateImportance', () => ({
    updated: recalculateImportanceScores(),
  }))

  // Knowledge graph / draw page data
  handle('db:words:getGraphData', () => {
    const db = getDb()
    interface WordRow {
      id: number; chinese: string; pinyin: string; meaning: string
      difficulty: number; importance_score: number; category: string
      best_state: string
    }
    const words = db.prepare(`
      SELECT w.id, w.chinese, w.pinyin, w.meaning, w.difficulty, w.importance_score,
             COALESCE(w.category, 'Other') AS category,
             COALESCE(
               CASE MAX(CASE c.state WHEN 'mastered' THEN 4 WHEN 'review' THEN 3
                                     WHEN 'learning' THEN 2 ELSE 1 END)
                 WHEN 4 THEN 'mastered' WHEN 3 THEN 'review'
                 WHEN 2 THEN 'learning' ELSE 'new' END, 'new') AS best_state
      FROM words w LEFT JOIN cards c ON c.word_id = w.id
      GROUP BY w.id
      ORDER BY w.importance_score DESC
      LIMIT 300
    `).all() as WordRow[]
    return { words }
  })

  // Word learning history — active language only
  handle('db:stats:getWordLearningHistory', () => {
    const db = getDb()
    const newPerDay = db.prepare(`
      SELECT date(min_review) as date, COUNT(*) as count
      FROM (SELECT word_id, MIN(reviewed_at) as min_review FROM reviews GROUP BY word_id)
      GROUP BY date(min_review)
      ORDER BY date ASC
    `).all() as { date: string; count: number }[]

    const masteredPerDay = db.prepare(`
      SELECT date(last_review) as date, COUNT(DISTINCT word_id) as count
      FROM cards
      WHERE state = 'mastered' AND last_review IS NOT NULL
      GROUP BY date(last_review)
      ORDER BY date ASC
    `).all() as { date: string; count: number }[]

    return { newPerDay, masteredPerDay }
  })

  // Reading readiness
  handle('db:documents:analyzeReadiness', (docId: number) => analyzeReadiness(docId))
}
