import { getDb } from '../db'
import type { User } from '../schema'

export const userRepository = {
  get(): User {
    return getDb().prepare('SELECT * FROM users LIMIT 1').get() as User
  },

  addXp(amount: number, reason: string): User {
    const db = getDb()
    db.prepare('UPDATE users SET total_xp = total_xp + ? WHERE id = 1').run(amount)
    db.prepare('INSERT INTO xp_log (amount, reason) VALUES (?, ?)').run(amount, reason)
    const user = this.get()
    const newLevel = computeLevel(user.total_xp)
    if (newLevel !== user.level) {
      db.prepare('UPDATE users SET level = ? WHERE id = 1').run(newLevel)
    }
    return this.get()
  },

  updateStreak(): User {
    const db = getDb()
    const user = this.get()
    const today = new Date().toISOString().slice(0, 10)
    const last = user.last_study_date?.slice(0, 10)

    if (last === today) return user

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    const newStreak = last === yesterday ? user.streak_days + 1 : 1

    db.prepare('UPDATE users SET streak_days = ?, last_study_date = ? WHERE id = 1').run(
      newStreak,
      new Date().toISOString()
    )
    return this.get()
  },

  updateDailyGoal(goal: number): void {
    getDb().prepare('UPDATE users SET daily_xp_goal = ? WHERE id = 1').run(goal)
  },
}

function computeLevel(xp: number): number {
  // Each level requires progressively more XP
  // Level n requires n * 100 XP to reach
  let level = 1
  let required = 0
  while (xp >= required + level * 100) {
    required += level * 100
    level++
  }
  return level
}
