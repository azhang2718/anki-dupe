import { getDb } from '../database/db'
import { achievementRepository } from '../database/repositories/achievementRepository'
import type { Achievement } from '../database/schema'

interface CheckContext {
  wordCount?: number
  masteredCount?: number
  streakDays?: number
  documentCount?: number
  sessionPerfect?: boolean
}

/**
 * Check all achievement conditions and unlock any newly earned ones.
 * Returns the list of newly unlocked achievements (for toast display).
 */
export function checkAchievements(ctx: CheckContext = {}): Achievement[] {
  const db = getDb()
  const unlocked: Achievement[] = []

  function tryUnlock(key: string): void {
    const result = achievementRepository.unlock(key)
    if (result) unlocked.push(result)
  }

  // Resolve counts if not provided
  const wordCount     = ctx.wordCount     ?? (db.prepare('SELECT COUNT(*) as c FROM words').get() as { c: number }).c
  const masteredCount = ctx.masteredCount ?? (db.prepare("SELECT COUNT(*) as c FROM cards WHERE state='mastered'").get() as { c: number }).c
  const docCount      = ctx.documentCount ?? (db.prepare('SELECT COUNT(*) as c FROM documents').get() as { c: number }).c
  const streakDays    = ctx.streakDays    ?? (db.prepare('SELECT streak_days FROM users LIMIT 1').get() as { streak_days: number })?.streak_days ?? 0

  // Word count milestones
  if (wordCount >= 1)    tryUnlock('first_word')
  if (wordCount >= 10)   tryUnlock('words_10')
  if (wordCount >= 100)  tryUnlock('words_100')
  if (wordCount >= 500)  tryUnlock('words_500')
  if (wordCount >= 1000) tryUnlock('words_1000')

  // Mastery milestones
  if (masteredCount >= 50)  tryUnlock('mastered_50')
  if (masteredCount >= 500) tryUnlock('mastered_500')

  // Streak milestones
  if (streakDays >= 7)   tryUnlock('streak_7')
  if (streakDays >= 30)  tryUnlock('streak_30')
  if (streakDays >= 100) tryUnlock('streak_100')

  // Import milestone
  if (docCount >= 1) tryUnlock('first_import')

  // Perfect session
  if (ctx.sessionPerfect) tryUnlock('perfect_session')

  return unlocked
}
