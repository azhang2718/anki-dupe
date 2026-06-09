import Anthropic from '@anthropic-ai/sdk'
import { settingsRepository } from '../database/repositories/settingsRepository'
import { LANGUAGE_CONFIGS, type LanguageCode } from '../database/languages'

export const CATEGORIES = [
  'Food & Drink', 'Work & Business', 'Travel & Places', 'Daily Life',
  'People & Society', 'Nature & Environment', 'Time & Numbers', 'Health & Body',
  'Education & Culture', 'Emotions & Character', 'Tech & Media', 'Other',
] as const

export type Category = typeof CATEGORIES[number]

export interface ExtractedWord {
  chinese: string
  pinyin: string
  meaning: string
  part_of_speech: string | null
  difficulty: number
  frequency_score: number
  example_sentence: string | null
  example_translation: string | null
  category: string
}

function getClient(): Anthropic {
  const apiKey = settingsRepository.get('claude_api_key') ?? ''
  if (!apiKey) throw new Error('Claude API key not set. Add it in Settings.')
  return new Anthropic({ apiKey })
}

// ─── Language-aware extraction ────────────────────────────────────────────────

function buildExtractionPrompt(text: string, language: LanguageCode): { system: string; user: string } {
  const config = LANGUAGE_CONFIGS[language]

  const system = `You are a ${config.name} language expert that extracts vocabulary from text.
Return ONLY a valid JSON array. No markdown, no explanation — just the raw JSON array.`

  const fieldNotes = config.extractionNotes.trim()
  const exampleEntry = language === 'chinese'
    ? `{"chinese":"学习","pinyin":"xuéxí","meaning":"to study; to learn","part_of_speech":"verb","difficulty":1,"frequency_score":95,"category":"Education & Culture","example_sentence":"我每天都在学习中文。","example_translation":"I study Chinese every day."}`
    : language === 'japanese'
    ? `{"chinese":"勉強","pinyin":"べんきょう","meaning":"to study; studying","part_of_speech":"noun/verb","difficulty":1,"frequency_score":92,"category":"Education & Culture","example_sentence":"毎日日本語を勉強します。","example_translation":"I study Japanese every day."}`
    : `{"chinese":"공부","pinyin":"gongbu","meaning":"to study; studying","part_of_speech":"noun/verb","difficulty":1,"frequency_score":92,"category":"Education & Culture","example_sentence":"매일 한국어를 공부합니다.","example_translation":"I study Korean every day."}`

  const user = `Extract the most useful ${config.name} vocabulary words from this text for a language learner.

Rules:
- Focus on unique, useful words (avoid ultra-common function words unless contextually important)
- Include a mix of difficulty levels
- Aim for 10–30 words per call
- difficulty: 1 (beginner) to 5 (advanced)
- frequency_score: 1 (rare) to 100 (very common)
- category: assign exactly one from: "Food & Drink", "Work & Business", "Travel & Places", "Daily Life", "People & Society", "Nature & Environment", "Time & Numbers", "Health & Body", "Education & Culture", "Emotions & Character", "Tech & Media", "Other"

Field definitions for this language (${config.name}):
${fieldNotes}
- "meaning": concise English definition
- "part_of_speech": grammatical role
- "difficulty": 1–5
- "frequency_score": 1–100
- "example_sentence": a short natural ${config.name} sentence using the word
- "example_translation": English translation of the example

Return this exact JSON structure (the "chinese" field holds the target-language word, "pinyin" holds the reading):
[
  ${exampleEntry}
]

Text to analyze:
"""
${text.slice(0, 6000)}
"""`

  return { system, user }
}

export async function extractVocabulary(rawText: string, language: LanguageCode = 'chinese'): Promise<ExtractedWord[]> {
  const client = getClient()
  const { system, user } = buildExtractionPrompt(rawText, language)

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system,
    messages: [{ role: 'user', content: user }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude')

  let parsed: unknown
  try {
    const cleaned = content.text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error(`Claude returned invalid JSON: ${content.text.slice(0, 200)}`)
  }

  if (!Array.isArray(parsed)) throw new Error('Claude response is not an array')

  return parsed.map((w: Record<string, unknown>) => ({
    chinese:             String(w.chinese ?? ''),
    pinyin:              String(w.pinyin ?? ''),
    meaning:             String(w.meaning ?? ''),
    part_of_speech:      w.part_of_speech ? String(w.part_of_speech) : null,
    difficulty:          Number(w.difficulty ?? 3),
    frequency_score:     Number(w.frequency_score ?? 50),
    example_sentence:    w.example_sentence ? String(w.example_sentence) : null,
    example_translation: w.example_translation ? String(w.example_translation) : null,
    category:            CATEGORIES.includes(w.category as Category) ? String(w.category) : 'Other',
  })).filter((w) => w.chinese.length > 0)
}

export async function testApiKey(): Promise<boolean> {
  try {
    const client = getClient()
    await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'hi' }],
    })
    return true
  } catch {
    return false
  }
}
