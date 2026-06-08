import { getDb } from '../db'
import type { Word } from '../schema'

export const wordRepository = {
  getAll(): Word[] {
    return getDb().prepare('SELECT * FROM words ORDER BY importance_score DESC').all() as Word[]
  },

  getById(id: number): Word | null {
    return (getDb().prepare('SELECT * FROM words WHERE id = ?').get(id) as Word) ?? null
  },

  getByChinese(chinese: string): Word | null {
    return (getDb().prepare('SELECT * FROM words WHERE chinese = ?').get(chinese) as Word) ?? null
  },

  create(word: Omit<Word, 'id' | 'created_at'>): Word {
    const db = getDb()
    const result = db
      .prepare(
        `INSERT INTO words
          (chinese, pinyin, meaning, difficulty, frequency_score, importance_score,
           part_of_speech, example_sentence, example_translation, source_document_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        word.chinese,
        word.pinyin,
        word.meaning,
        word.difficulty,
        word.frequency_score,
        word.importance_score,
        word.part_of_speech ?? null,
        word.example_sentence ?? null,
        word.example_translation ?? null,
        word.source_document_id ?? null
      )
    return this.getById(result.lastInsertRowid as number)!
  },

  upsert(word: Omit<Word, 'id' | 'created_at'>): Word {
    const existing = this.getByChinese(word.chinese)
    if (existing) {
      getDb()
        .prepare(
          `UPDATE words SET pinyin=?, meaning=?, difficulty=?, frequency_score=?,
           importance_score=?, part_of_speech=?, example_sentence=?, example_translation=?
           WHERE chinese=?`
        )
        .run(
          word.pinyin,
          word.meaning,
          word.difficulty,
          word.frequency_score,
          word.importance_score,
          word.part_of_speech ?? null,
          word.example_sentence ?? null,
          word.example_translation ?? null,
          word.chinese
        )
      return this.getByChinese(word.chinese)!
    }
    return this.create(word)
  },

  count(): number {
    return (getDb().prepare('SELECT COUNT(*) as c FROM words').get() as { c: number }).c
  },

  getTopByImportance(limit = 20): Word[] {
    return getDb()
      .prepare('SELECT * FROM words ORDER BY importance_score DESC LIMIT ?')
      .all(limit) as Word[]
  },
}
