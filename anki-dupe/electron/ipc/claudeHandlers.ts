import { ipcMain } from 'electron'
import { extractVocabulary, testApiKey } from '../services/claudeService'
import { documentRepository } from '../database/repositories/documentRepository'
import { wordRepository } from '../database/repositories/wordRepository'
import { getDb } from '../database/db'
import { createInitialCards } from '../utils/fsrs'

function handle(channel: string, fn: (...args: unknown[]) => unknown) {
  ipcMain.handle(channel, async (_event, ...args) => {
    try {
      return { ok: true, data: await fn(...args) }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  })
}

export function registerClaudeHandlers(): void {
  // Test whether the stored API key works
  handle('claude:testKey', () => testApiKey())

  // Extract vocabulary from a document's raw text and save words+cards
  handle('claude:extractFromDocument', async (docId: number) => {
    const doc = documentRepository.getById(docId)
    if (!doc) throw new Error('Document not found')
    if (!doc.raw_text) throw new Error('Document has no extracted text. Run OCR first.')

    const words = await extractVocabulary(doc.raw_text)
    if (!words.length) throw new Error('No vocabulary found in document')

    const db = getDb()

    const saved = db.transaction(() => {
      const results = []
      for (const w of words) {
        const saved = wordRepository.upsert({
          chinese:             w.chinese,
          pinyin:              w.pinyin,
          meaning:             w.meaning,
          difficulty:          w.difficulty,
          frequency_score:     w.frequency_score,
          importance_score:    w.frequency_score,
          part_of_speech:      w.part_of_speech,
          example_sentence:    w.example_sentence,
          example_translation: w.example_translation,
          source_document_id:  docId,
        })

        // Create cards only if none exist yet for this word
        const existing = db.prepare('SELECT id FROM cards WHERE word_id = ?').all(saved.id)
        if (existing.length === 0) {
          for (const card of createInitialCards(saved.id)) {
            db.prepare(
              `INSERT INTO cards
                (word_id, card_type, state, due, stability, difficulty,
                 elapsed_days, scheduled_days, reps, lapses, last_review)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).run(
              card.word_id, card.card_type, card.state, card.due,
              card.stability, card.difficulty, card.elapsed_days,
              card.scheduled_days, card.reps, card.lapses, card.last_review
            )
          }
        }
        results.push(saved)
      }
      return results
    })()

    // Update document word count
    documentRepository.updateComprehension(docId, 0, saved.length)

    return { wordsAdded: saved.length, words: saved }
  })

  // Extract vocabulary from arbitrary text (used in Settings preview / manual entry)
  handle('claude:extractFromText', async (text: string) => {
    const words = await extractVocabulary(text)
    return words
  })
}
