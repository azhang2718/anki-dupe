import { getDb } from '../database/db'

export function exportFullBackup(): any {
  const db = getDb()
  const data: any = {}

  data.users = db.prepare('SELECT * FROM users').all()
  data.words = db.prepare('SELECT * FROM words').all()
  data.cards = db.prepare('SELECT * FROM cards').all()
  data.reviews = db.prepare('SELECT * FROM reviews').all()
  data.achievements = db.prepare('SELECT * FROM achievements').all()
  data.documents = db.prepare('SELECT * FROM documents').all()
  data.settings = db.prepare('SELECT * FROM settings').all()
  data.statistics = db.prepare('SELECT * FROM statistics').all()

  return data
}

export function importFullBackup(data: any): void {
  const db = getDb()

  db.transaction(() => {
    // Destructive: Clear existing data
    db.prepare('DELETE FROM reviews').run()
    db.prepare('DELETE FROM cards').run()
    db.prepare('DELETE FROM words').run()
    db.prepare('DELETE FROM documents').run()
    db.prepare('DELETE FROM statistics').run()
    db.prepare('DELETE FROM settings').run()
    db.prepare('DELETE FROM users').run()
    db.prepare('DELETE FROM achievements').run()

    // Users
    if (data.users) {
      const insert = db.prepare('INSERT INTO users (id, total_xp, level, streak_days, last_study_date, daily_xp_goal, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      for (const u of data.users) {
        insert.run(u.id, u.total_xp, u.level, u.streak_days, u.last_study_date, u.daily_xp_goal, u.created_at)
      }
    }

    // Words
    if (data.words) {
      const insert = db.prepare('INSERT INTO words (id, chinese, pinyin, meaning, part_of_speech, example_sentence, example_translation, importance_score, frequency_score, difficulty, source_document_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      for (const w of data.words) {
        insert.run(w.id, w.chinese, w.pinyin, w.meaning, w.part_of_speech, w.example_sentence, w.example_translation, w.importance_score, w.frequency_score, w.difficulty, w.source_document_id, w.created_at)
      }
    }

    // Cards
    if (data.cards) {
      const insert = db.prepare('INSERT INTO cards (id, word_id, card_type, state, due, stability, difficulty, elapsed_days, scheduled_days, reps, lapses, last_review) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      for (const c of data.cards) {
        insert.run(c.id, c.word_id, c.card_type, c.state, c.due, c.stability, c.difficulty, c.elapsed_days, c.scheduled_days, c.reps, c.lapses, c.last_review)
      }
    }

    // Reviews
    if (data.reviews) {
      const insert = db.prepare('INSERT INTO reviews (id, card_id, word_id, rating, time_taken_ms, xp_earned, reviewed_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      for (const r of data.reviews) {
        insert.run(r.id, r.card_id, r.word_id, r.rating, r.time_taken_ms, r.xp_earned, r.reviewed_at)
      }
    }

    // Achievements
    if (data.achievements) {
      const insert = db.prepare('INSERT INTO achievements (id, key, name, description, icon, xp_reward, unlocked_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      for (const a of data.achievements) {
        insert.run(a.id, a.key, a.name, a.description, a.icon, a.xp_reward, a.unlocked_at)
      }
    }

    // Documents
    if (data.documents) {
      const insert = db.prepare('INSERT INTO documents (id, title, file_path, source_type, raw_text, processing_status, word_count, known_word_count, comprehension_score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      for (const d of data.documents) {
        insert.run(d.id, d.title, d.file_path, d.source_type, d.raw_text, d.processing_status, d.word_count, d.known_word_count, d.comprehension_score, d.created_at)
      }
    }

    // Settings
    if (data.settings) {
      const insert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
      for (const s of data.settings) {
        insert.run(s.key, s.value)
      }
    }

    // Statistics
    if (data.statistics) {
      const insert = db.prepare('INSERT INTO statistics (id, date, words_reviewed, words_correct, xp_earned, study_time_ms, new_words_learned) VALUES (?, ?, ?, ?, ?, ?, ?)')
      for (const s of data.statistics) {
        insert.run(s.id, s.date, s.words_reviewed, s.words_correct, s.xp_earned, s.study_time_ms, s.new_words_learned)
      }
    }
  })()
}
