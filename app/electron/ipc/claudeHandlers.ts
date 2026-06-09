import { ipcMain } from 'electron'
import Anthropic from '@anthropic-ai/sdk'
import { extractVocabulary, testApiKey } from '../services/claudeService'
import { documentRepository } from '../database/repositories/documentRepository'
import { wordRepository } from '../database/repositories/wordRepository'
import { settingsRepository } from '../database/repositories/settingsRepository'
import { getDb, getActiveLanguage } from '../database/db'
import { LANGUAGE_CONFIGS } from '../database/languages'
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
  handle('claude:testKey', () => testApiKey())

  // Extract vocabulary from a document's raw text and save words+cards
  handle('claude:extractFromDocument', async (docId: number) => {
    const doc = documentRepository.getById(docId)
    if (!doc) throw new Error('Document not found')
    if (!doc.raw_text) throw new Error('Document has no extracted text. Run OCR first.')

    const language = getActiveLanguage()
    const words = await extractVocabulary(doc.raw_text, language)
    if (!words.length) throw new Error('No vocabulary found in document')

    const db = getDb()

    const saved = db.transaction(() => {
      const results = []
      for (const w of words) {
        const savedWord = wordRepository.upsert({
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
          category:            w.category ?? 'Other',
        })

        const existing = db.prepare('SELECT id FROM cards WHERE word_id = ?').all(savedWord.id)
        if (existing.length === 0) {
          for (const card of createInitialCards(savedWord.id)) {
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
        results.push(savedWord)
      }
      return results
    })()

    documentRepository.updateComprehension(docId, 0, saved.length)

    return { wordsAdded: saved.length, words: saved }
  })

  // Extract vocabulary from arbitrary text
  handle('claude:extractFromText', async (text: string) => {
    const language = getActiveLanguage()
    return extractVocabulary(text, language)
  })

  // Identify a hand-drawn character — language-aware prompt
  handle('claude:identifyCharacter', async (imageDataUrl: string) => {
    const apiKey = settingsRepository.get('claude_api_key') ?? ''
    if (!apiKey) throw new Error('Claude API key not set. Add it in Settings.')
    const client = new Anthropic({ apiKey })

    const lang = getActiveLanguage()
    const config = LANGUAGE_CONFIGS[lang]

    const base64 = (imageDataUrl as string).replace(/^data:image\/\w+;base64,/, '')

    const promptText = lang === 'chinese'
      ? `This is a hand-drawn Chinese character. Identify it and return ONLY a JSON object, no markdown:
{"chinese":"字","pinyin":"zì","meaning":"character; word","confidence":"high"}
If you cannot identify it, return: {"chinese":"?","pinyin":"","meaning":"Could not identify","confidence":"low"}`
      : lang === 'japanese'
      ? `This is a hand-drawn Japanese character (hiragana, katakana, or kanji). Identify it and return ONLY a JSON object, no markdown:
{"chinese":"勉強","pinyin":"べんきょう","meaning":"study; to study","confidence":"high"}
The "chinese" field is the Japanese word/character. The "pinyin" field is the hiragana reading.
If you cannot identify it, return: {"chinese":"?","pinyin":"","meaning":"Could not identify","confidence":"low"}`
      : `This is a hand-drawn Korean character (hangul). Identify it and return ONLY a JSON object, no markdown:
{"chinese":"공부","pinyin":"gongbu","meaning":"study; to study","confidence":"high"}
The "chinese" field is the Korean word. The "pinyin" field is the Revised Romanization.
If you cannot identify it, return: {"chinese":"?","pinyin":"","meaning":"Could not identify","confidence":"low"}`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/png', data: base64 } },
          { type: 'text', text: promptText },
        ],
      }],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    const cleaned = responseText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    return JSON.parse(cleaned)
  })
}
