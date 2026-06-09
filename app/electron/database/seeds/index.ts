import type Database from 'better-sqlite3'
import type { LanguageCode } from '../languages'
import { HIRAGANA_ENTRIES } from './hiragana'
import { KOREAN_JAMO_ENTRIES } from './korean'

// ─── Seed tracking table ──────────────────────────────────────────────────────

const SEEDS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS _seeds (
    name        TEXT PRIMARY KEY,
    applied_at  TEXT NOT NULL DEFAULT (datetime('now'))
  )
`

// ─── Initial FSRS card builder ────────────────────────────────────────────────
// Mirror of what createInitialCards does — avoids a circular import with repositories.

function buildInitialCards(wordId: number): Array<{
  word_id: number
  card_type: string
  state: string
  due: string
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  reps: number
  lapses: number
  last_review: string | null
}> {
  const now = new Date().toISOString()
  // Must match the CHECK constraint in migration 001: zh_to_en | en_to_zh | cloze | reading
  const cardTypes = ['zh_to_en', 'en_to_zh', 'cloze'] as const
  return cardTypes.map((type) => ({
    word_id: wordId,
    card_type: type,
    state: 'new',
    due: now,
    stability: 0,
    difficulty: 5,
    elapsed_days: 0,
    scheduled_days: 0,
    reps: 0,
    lapses: 0,
    last_review: null,
  }))
}

// ─── Public seeder ────────────────────────────────────────────────────────────

/**
 * Seeds the alphabet for the given language DB if it hasn't been seeded yet.
 * Safe to call on every open — it checks a `_seeds` table before doing work.
 * For Chinese, this is a no-op (Chinese has no fixed alphabet to seed).
 */
export function seedAlphabetIfNeeded(db: Database.Database, lang: LanguageCode): void {
  // Ensure the seeds tracking table exists
  db.exec(SEEDS_TABLE_SQL)

  const SEED_NAME = 'alphabet_v3'
  const alreadyDone = db.prepare('SELECT 1 FROM _seeds WHERE name = ?').get(SEED_NAME)
  if (alreadyDone) return

  // Pick entries for this language
  let entries: Array<{ char: string; romaji: string; meaning: string; category: string; difficulty: number; frequency: number }>
  if (lang === 'japanese') {
    entries = HIRAGANA_ENTRIES
  } else if (lang === 'korean') {
    entries = KOREAN_JAMO_ENTRIES
  } else {
    // Chinese — mark as done so we don't check again, but insert nothing
    db.prepare('INSERT OR IGNORE INTO _seeds (name) VALUES (?)').run(SEED_NAME)
    return
  }

  const insertWord = db.prepare<[string, string, string, number, number, number, string]>(`
    INSERT INTO words
      (chinese, pinyin, meaning, difficulty, frequency_score, importance_score,
       part_of_speech, example_sentence, example_translation, category)
    VALUES
      (?, ?, ?, ?, ?, ?, 'character', NULL, NULL, ?)
    ON CONFLICT(chinese) DO UPDATE SET
      pinyin           = excluded.pinyin,
      meaning          = excluded.meaning,
      difficulty       = excluded.difficulty,
      frequency_score  = excluded.frequency_score,
      importance_score = excluded.importance_score
  `)

  const insertCard = db.prepare(`
    INSERT OR IGNORE INTO cards
      (word_id, card_type, state, due, stability, difficulty,
       elapsed_days, scheduled_days, reps, lapses, last_review)
    VALUES
      (@word_id, @card_type, @state, @due, @stability, @difficulty,
       @elapsed_days, @scheduled_days, @reps, @lapses, @last_review)
  `)

  const getWordId = db.prepare<[string]>('SELECT id FROM words WHERE chinese = ?')

  const seed = db.transaction(() => {
    for (const entry of entries) {
      insertWord.run(
        entry.char,
        entry.romaji,
        entry.meaning,
        entry.difficulty,
        entry.frequency,
        entry.frequency, // importance_score mirrors frequency for alphabet chars
        entry.category,
      )

      // Always look up the real id — lastInsertRowid is unreliable after ON CONFLICT DO UPDATE
      const row = getWordId.get(entry.char) as { id: number } | undefined
      if (!row) continue

      // Insert initial FSRS cards — INSERT OR IGNORE skips any that already exist
      for (const card of buildInitialCards(row.id)) {
        insertCard.run(card)
      }
    }

    db.prepare('INSERT OR IGNORE INTO _seeds (name) VALUES (?)').run(SEED_NAME)
  })

  seed()
}
