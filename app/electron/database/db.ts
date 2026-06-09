import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync, unlinkSync } from 'fs'
import { up as migration001, version as v001 } from './migrations/001_initial'
import { up as migration002, version as v002 } from './migrations/002_seed_achievements'
import { up as migration003, version as v003 } from './migrations/003_add_category'
import { up as migration004, version as v004 } from './migrations/004_stats_mastered'
import { getSettingsDb } from './settingsDb'
import type { LanguageCode } from './languages'

const migrations = [
  { version: v001, sql: migration001 },
  { version: v002, sql: migration002 },
  { version: v003, sql: migration003 },
  { version: v004, sql: migration004 },
]

// ─── Per-language DB cache ────────────────────────────────────────────────────

const _languageDbs = new Map<LanguageCode, Database.Database>()
let _activeLanguage: LanguageCode = 'chinese'

// ─── Active language (read from global settings DB) ───────────────────────────

export function getActiveLanguage(): LanguageCode {
  return _activeLanguage
}

export function initActiveLanguage(): void {
  const row = getSettingsDb()
    .prepare('SELECT value FROM settings WHERE key = ?')
    .get('active_language') as { value: string } | undefined
  _activeLanguage = (row?.value ?? 'chinese') as LanguageCode
}

// ─── Open a specific language DB ─────────────────────────────────────────────

function openLanguageDb(lang: LanguageCode): Database.Database {
  const userDataPath = app.getPath('userData')
  if (!existsSync(userDataPath)) mkdirSync(userDataPath, { recursive: true })

  // On first run, migrate legacy anki-dupe.sqlite → anki-dupe-chinese.sqlite
  if (lang === 'chinese') {
    const legacyPath = join(userDataPath, 'anki-dupe.sqlite')
    const chinesePath = join(userDataPath, 'anki-dupe-chinese.sqlite')
    if (existsSync(legacyPath) && !existsSync(chinesePath)) {
      try {
        copyFileSync(legacyPath, chinesePath)
        console.log('[db] Migrated anki-dupe.sqlite → anki-dupe-chinese.sqlite')
      } catch (err) {
        console.error('[db] Migration copy failed:', err)
      }
    }

    // Also seed global settings from Chinese DB if global settings are empty
    const globalApiKey = getSettingsDb()
      .prepare("SELECT value FROM settings WHERE key = 'claude_api_key'")
      .get() as { value: string } | undefined
    if (existsSync(chinesePath) && (!globalApiKey || !globalApiKey.value)) {
      try {
        const legacyDb = new Database(chinesePath, { readonly: true })
        const rows = legacyDb
          .prepare("SELECT key, value FROM settings WHERE key IN ('claude_api_key','offline_mode','review_limit')")
          .all() as { key: string; value: string }[]
        const upd = getSettingsDb().prepare('UPDATE settings SET value = ? WHERE key = ? AND value = ?')
        for (const { key, value } of rows) {
          if (value) upd.run(value, key, '')
        }
        legacyDb.close()
      } catch { /* non-fatal */ }
    }
  }

  const dbPath = join(userDataPath, `anki-dupe-${lang}.sqlite`)
  let db: Database.Database

  try {
    db = new Database(dbPath)
    const result = db.pragma('integrity_check') as { integrity_check: string }[]
    if (result[0]?.integrity_check !== 'ok') {
      throw new Error(`Integrity check failed: ${JSON.stringify(result)}`)
    }
  } catch (err) {
    console.error(`[db] Failed to open ${lang} DB, trying fresh:`, err)
    db = new Database(dbPath)
  }

  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  runMigrations(db)
  ensureDefaultUser(db)

  return db
}

// ─── Public getters ───────────────────────────────────────────────────────────

/** Returns the DB for the currently active language. */
export function getDb(): Database.Database {
  return getDbForLanguage(_activeLanguage)
}

/** Opens (or reuses) the DB for any specific language. */
export function getDbForLanguage(lang: LanguageCode): Database.Database {
  if (!_languageDbs.has(lang)) {
    _languageDbs.set(lang, openLanguageDb(lang))
  }
  return _languageDbs.get(lang)!
}

/** Switch the active language (caller is responsible for reloading the renderer). */
export function switchLanguage(lang: LanguageCode): void {
  getSettingsDb()
    .prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('active_language', ?)")
    .run(lang)
  _activeLanguage = lang
  // Make sure the new DB is open and ready
  getDbForLanguage(lang)
}

// ─── Backup ───────────────────────────────────────────────────────────────────

export function backupDatabase(): void {
  const userDataPath = app.getPath('userData')
  const backupsPath = join(userDataPath, 'backups')
  if (!existsSync(backupsPath)) mkdirSync(backupsPath, { recursive: true })

  const lang = _activeLanguage
  const dbPath = join(userDataPath, `anki-dupe-${lang}.sqlite`)
  if (!existsSync(dbPath)) return

  const today = new Date().toISOString().split('T')[0]
  const backupPath = join(backupsPath, `anki-dupe-${lang}-${today}.sqlite`)
  if (existsSync(backupPath)) return

  try {
    copyFileSync(dbPath, backupPath)
    const files = readdirSync(backupsPath)
      .filter((f) => f.startsWith(`anki-dupe-${lang}-`))
      .map((f) => ({ name: f, time: statSync(join(backupsPath, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time)
    for (const file of files.slice(7)) unlinkSync(join(backupsPath, file.name))
  } catch (err) {
    console.error('[db] Backup failed:', err)
  }
}

// ─── Close ────────────────────────────────────────────────────────────────────

export function closeDb(): void {
  for (const db of _languageDbs.values()) {
    try { db.close() } catch { /* ignore */ }
  }
  _languageDbs.clear()
}

// ─── Migrations ───────────────────────────────────────────────────────────────

function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version    INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  const applied = db
    .prepare('SELECT version FROM _migrations')
    .all()
    .map((r) => (r as { version: number }).version)

  for (const { version, sql } of migrations) {
    if (!applied.includes(version)) {
      db.exec(sql)
      db.prepare('INSERT INTO _migrations (version) VALUES (?)').run(version)
    }
  }
}

function ensureDefaultUser(db: Database.Database): void {
  try {
    const count = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c
    if (count === 0) {
      db.prepare('INSERT INTO users (daily_xp_goal) VALUES (50)').run()
    }
  } catch { /* users table might not exist on very old DBs — migrations handle it */ }
}
