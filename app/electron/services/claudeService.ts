import Anthropic from '@anthropic-ai/sdk'
import { settingsRepository } from '../database/repositories/settingsRepository'

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

const EXTRACT_SYSTEM = `You are a Chinese language expert that extracts vocabulary from text.
Return ONLY a valid JSON array. No markdown, no explanation — just the raw JSON array.`

const EXTRACT_PROMPT = (text: string) => `Extract the most useful Chinese vocabulary words from this text for a language learner.

Rules:
- Focus on unique, useful words (not ultra-common particles like 的/了/是 unless contextually important)
- Include a mix of difficulty levels
- Aim for 10–30 words per call
- difficulty: 1 (beginner) to 5 (advanced)
- frequency_score: 1 (rare) to 100 (very common in Chinese)
- pinyin: standard tone-marked pinyin (e.g. "nǐ hǎo")
- example_sentence: a short natural Chinese sentence using the word
- example_translation: English translation of the example
- category: assign exactly one from: "Food & Drink", "Work & Business", "Travel & Places", "Daily Life", "People & Society", "Nature & Environment", "Time & Numbers", "Health & Body", "Education & Culture", "Emotions & Character", "Tech & Media", "Other"

Return this exact JSON structure:
[
  {
    "chinese": "学习",
    "pinyin": "xuéxí",
    "meaning": "to study; to learn",
    "part_of_speech": "verb",
    "difficulty": 1,
    "frequency_score": 95,
    "category": "Education & Culture",
    "example_sentence": "我每天都在学习中文。",
    "example_translation": "I study Chinese every day."
  }
]

Text to analyze:
"""
${text.slice(0, 6000)}
"""`

function getClient(): Anthropic {
  const apiKey = settingsRepository.get('claude_api_key') ?? ''
  if (!apiKey) throw new Error('Claude API key not set. Add it in Settings.')
  return new Anthropic({ apiKey })
}

export async function extractVocabulary(rawText: string): Promise<ExtractedWord[]> {
  const client = getClient()

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system: EXTRACT_SYSTEM,
    messages: [{ role: 'user', content: EXTRACT_PROMPT(rawText) }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude')

  let parsed: unknown
  try {
    // Strip any accidental markdown code fences
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
