import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync, unlinkSync } from 'fs'
import { up as migration001, version as v001 } from './migrations/001_initial'
import { up as migration002, version as v002 } from './migrations/002_seed_achievements'

const migrations = [
  { version: v001, sql: migration001 },
  { version: v002, sql: migration002 },
]

let _db: Database.Database | null = null

export function backupDatabase(): void {
  const userDataPath = app.getPath('userData')
  const backupsPath = join(userDataPath, 'backups')
  if (!existsSync(backupsPath)) mkdirSync(backupsPath, { recursive: true })

  const dbPath = join(userDataPath, 'anki-dupe.sqlite')
  if (!existsSync(dbPath)) return

  const today = new Date().toISOString().split('T')[0]
  const backupName = `anki-dupe-${today}.sqlite`
  const backupPath = join(backupsPath, backupName)

  if (existsSync(backupPath)) return // Already backed up today

  try {
    copyFileSync(dbPath, backupPath)
    
    // Keep only last 7 backups
    const files = readdirSync(backupsPath)
      .map((f) => ({ name: f, time: statSync(join(backupsPath, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time)

    if (files.length > 7) {
      for (const file of files.slice(7)) {
        unlinkSync(join(backupsPath, file.name))
      }
    }
  } catch (err) {
    console.error('Failed to backup database:', err)
  }
}

export function getDb(): Database.Database {
  if (_db) return _db

  const userDataPath = app.getPath('userData')
  if (!existsSync(userDataPath)) mkdirSync(userDataPath, { recursive: true })

  const dbPath = join(userDataPath, 'anki-dupe.sqlite')
  try {
    _db = new Database(dbPath)
    // Check integrity
    const integrity = _db.pragma('integrity_check') as string
    if (integrity !== 'ok') {
      throw new Error(`Database integrity check failed: ${integrity}`)
    }
  } catch (err) {
    console.error('Database initialization failed:', err)
    // In a real app we might try to restore from a backup here
    // For now we'll just rethrow or let better-sqlite3 handle it
    _db = new Database(dbPath) 
  }

  // Enable WAL mode
 for better concurrent performance
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')

  runMigrations(_db)
  ensureDefaultUser(_db)
  ensureDefaultSettings(_db)

  return _db
}

function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
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
  const count = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c
  if (count === 0) {
    db.prepare('INSERT INTO users (daily_xp_goal) VALUES (50)').run()
  }
}

function ensureDefaultSettings(db: Database.Database): void {
  const defaults: Record<string, string> = {
    claude_api_key: '',
    theme: 'light',
    always_on_top: 'false',
    widget_transparency: '0.9',
    daily_xp_goal: '50',
    offline_mode: 'false',
  }
  const insert = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)')
  for (const [key, value] of Object.entries(defaults)) {
    insert.run(key, value)
  }
}

export function closeDb(): void {
  _db?.close()
  _db = null
}
