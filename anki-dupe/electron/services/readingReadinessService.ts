import { getDb } from '../database/db'
import { documentRepository } from '../database/repositories/documentRepository'

export interface ReadinessResult {
  docId: number
  comprehensionScore: number   // 0–100
  totalVocabFound: number      // vocabulary words found anywhere in text
  knownCount: number           // of those, how many are review/mastered
  unknownWords: UnknownWord[]  // sorted by importance desc
}

export interface UnknownWord {
  id: number
  chinese: string
  pinyin: string
  meaning: string
  difficulty: number
  importance_score: number
  card_state: string
}

export function analyzeReadiness(docId: number): ReadinessResult {
  const db = getDb()

  const doc = documentRepository.getById(docId)
  if (!doc) throw new Error('Document not found')
  if (!doc.raw_text) throw new Error('Document has no extracted text. Run OCR first.')

  const text = doc.raw_text

  // Fetch all words with their best card state
  interface WordWithState {
    id: number
    chinese: string
    pinyin: string
    meaning: string
    difficulty: number
    importance_score: number
    best_state: 'new' | 'learning' | 'review' | 'mastered' | null
  }

  const words = db.prepare(`
    SELECT w.id, w.chinese, w.pinyin, w.meaning, w.difficulty, w.importance_score,
           CASE MAX(CASE cs.state WHEN 'mastered' THEN 4 WHEN 'review' THEN 3
                                  WHEN 'learning' THEN 2 ELSE 1 END)
             WHEN 4 THEN 'mastered' WHEN 3 THEN 'review'
             WHEN 2 THEN 'learning' ELSE 'new' END AS best_state
    FROM words w
    LEFT JOIN cards cs ON cs.word_id = w.id
    GROUP BY w.id
  `).all() as WordWithState[]

  const found: WordWithState[] = []

  for (const w of words) {
    // Skip single characters to avoid false positives (they appear in almost everything)
    if (w.chinese.length < 2) continue
    if (text.includes(w.chinese)) {
      found.push(w)
    }
  }

  const knownStates = new Set(['review', 'mastered'])
  const knownCount = found.filter((w) => knownStates.has(w.best_state ?? '')).length
  const totalVocabFound = found.length

  const comprehensionScore = totalVocabFound > 0
    ? Math.round((knownCount / totalVocabFound) * 100)
    : 0

  const unknownWords: UnknownWord[] = found
    .filter((w) => !knownStates.has(w.best_state ?? ''))
    .sort((a, b) => b.importance_score - a.importance_score)
    .map((w) => ({
      id: w.id,
      chinese: w.chinese,
      pinyin: w.pinyin,
      meaning: w.meaning,
      difficulty: w.difficulty,
      importance_score: w.importance_score,
      card_state: w.best_state ?? 'new',
    }))

  // Persist updated comprehension data to the document
  documentRepository.updateComprehension(docId, knownCount, totalVocabFound)

  return { docId, comprehensionScore, totalVocabFound, knownCount, unknownWords }
}
