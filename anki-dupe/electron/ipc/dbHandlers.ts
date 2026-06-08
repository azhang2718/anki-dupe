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
}
