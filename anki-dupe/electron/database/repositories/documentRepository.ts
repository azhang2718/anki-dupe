import { getDb } from '../db'
import type { Document } from '../schema'

export const documentRepository = {
  getAll(): Document[] {
    return getDb()
      .prepare('SELECT * FROM documents ORDER BY created_at DESC')
      .all() as Document[]
  },

  getById(id: number): Document | null {
    return (getDb().prepare('SELECT * FROM documents WHERE id = ?').get(id) as Document) ?? null
  },

  create(doc: Omit<Document, 'id' | 'created_at'>): Document {
    const result = getDb()
      .prepare(
        `INSERT INTO documents
          (title, source_type, file_path, raw_text, word_count,
           known_word_count, comprehension_score, processing_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        doc.title,
        doc.source_type,
        doc.file_path ?? null,
        doc.raw_text ?? null,
        doc.word_count,
        doc.known_word_count,
        doc.comprehension_score,
        doc.processing_status
      )
    return this.getById(result.lastInsertRowid as number)!
  },

  updateStatus(id: number, status: Document['processing_status'], rawText?: string): void {
    if (rawText !== undefined) {
      getDb()
        .prepare('UPDATE documents SET processing_status = ?, raw_text = ? WHERE id = ?')
        .run(status, rawText, id)
    } else {
      getDb()
        .prepare('UPDATE documents SET processing_status = ? WHERE id = ?')
        .run(status, id)
    }
  },

  updateComprehension(id: number, known: number, total: number): void {
    const score = total > 0 ? Math.round((known / total) * 100) : 0
    getDb()
      .prepare(
        'UPDATE documents SET known_word_count=?, word_count=?, comprehension_score=? WHERE id=?'
      )
      .run(known, total, score, id)
  },
}
