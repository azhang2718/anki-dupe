import { getSettingsDb } from '../settingsDb'

export const settingsRepository = {
  get(key: string): string {
    const row = getSettingsDb()
      .prepare('SELECT value FROM settings WHERE key = ?')
      .get(key) as { value: string } | undefined
    return row?.value ?? ''
  },

  set(key: string, value: string): void {
    getSettingsDb()
      .prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
      .run(key, value)
  },

  getAll(): Record<string, string> {
    const rows = getSettingsDb()
      .prepare('SELECT key, value FROM settings')
      .all() as { key: string; value: string }[]
    return Object.fromEntries(rows.map((r) => [r.key, r.value]))
  },
}
