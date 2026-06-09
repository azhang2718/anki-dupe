/**
 * Global settings database — language-independent.
 * Stores: API key, offline mode, active language.
 * All language-specific data lives in per-language DB files.
 */
import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

let _settingsDb: Database.Database | null = null

export function getSettingsDb(): Database.Database {
  if (_settingsDb) return _settingsDb

  const userDataPath = app.getPath('userData')
  if (!existsSync(userDataPath)) mkdirSync(userDataPath, { recursive: true })

  const dbPath = join(userDataPath, 'anki-dupe-settings.sqlite')
  _settingsDb = new Database(dbPath)
  _settingsDb.pragma('journal_mode = WAL')

  _settingsDb.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    )
  `)

  // Seed defaults only if they don't exist
  const defaults: Record<string, string> = {
    claude_api_key:  '',
    offline_mode:    'false',
    active_language: 'chinese',
    review_limit:    '50',
  }
  const ins = _settingsDb.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)')
  for (const [k, v] of Object.entries(defaults)) ins.run(k, v)

  return _settingsDb
}

export function closeSettingsDb(): void {
  _settingsDb?.close()
  _settingsDb = null
}
