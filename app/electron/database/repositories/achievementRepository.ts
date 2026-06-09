import { getDb } from '../db'
import type { Achievement } from '../schema'

export const achievementRepository = {
  getAll(): Achievement[] {
    return getDb().prepare('SELECT * FROM achievements ORDER BY id ASC').all() as Achievement[]
  },

  getUnlocked(): Achievement[] {
    return getDb()
      .prepare('SELECT * FROM achievements WHERE unlocked_at IS NOT NULL ORDER BY unlocked_at DESC')
      .all() as Achievement[]
  },

  unlock(key: string): Achievement | null {
    const db = getDb()
    const existing = db
      .prepare('SELECT * FROM achievements WHERE key = ?')
      .get(key) as Achievement | undefined
    if (!existing || existing.unlocked_at) return null

    db.prepare(`UPDATE achievements SET unlocked_at = datetime('now') WHERE key = ?`).run(key)
    return db.prepare('SELECT * FROM achievements WHERE key = ?').get(key) as Achievement
  },

  isUnlocked(key: string): boolean {
    const row = getDb()
      .prepare('SELECT unlocked_at FROM achievements WHERE key = ?')
      .get(key) as { unlocked_at: string | null } | undefined
    return !!row?.unlocked_at
  },
}
