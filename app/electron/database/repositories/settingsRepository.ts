import { getDb } from '../db'

export const settingsRepository = {
  get(key: string): string {
    const row = getDb()
      .prepare('SELECT value FROM settings WHERE key = ?')
      .get(key) as { value: string } | undefined
    return row?.value ?? ''
  },

  set(key: string, value: string): void {
    getDb()
      .prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
      .run(key, value)
  },

  getAll(): Record<string, string> {
    const rows = getDb()
      .prepare('SELECT key, value FROM settings')
      .all() as { key: string; value: string }[]
    return Object.fromEntries(rows.map((r) => [r.key, r.value]))
  },
}
