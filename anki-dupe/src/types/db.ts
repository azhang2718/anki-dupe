// Re-export DB types for use in the renderer process
// (mirrors electron/database/schema.ts — keep in sync)

export interface User {
  id: number
  created_at: string
  total_xp: number
  level: number
  streak_days: number
  last_study_date: string | null
  daily_xp_goal: number
}

export interface Word {
  id: number
  chinese: string
  pinyin: string
  meaning: string
  difficulty: number
  frequency_score: number
  importance_score: number
  part_of_speech: string | null
  example_sentence: string | null
  example_translation: string | null
  source_document_id: number | null
  created_at: string
}

export interface Card {
  id: number
  word_id: number
  card_type: 'zh_to_en' | 'en_to_zh' | 'cloze' | 'reading'
  state: 'new' | 'learning' | 'review' | 'mastered'
  due: string
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  reps: number
  lapses: number
  last_review: string | null
  created_at: string
}

export interface Review {
  id: number
  card_id: number
  word_id: number
  rating: 1 | 2 | 3 | 4
  time_taken_ms: number
  xp_earned: number
  reviewed_at: string
}

export interface Achievement {
  id: number
  key: string
  name: string
  description: string
  icon: string
  xp_reward: number
  unlocked_at: string | null
}

export interface Document {
  id: number
  title: string
  source_type: 'image' | 'pdf' | 'txt' | 'srt' | 'docx' | 'manual'
  file_path: string | null
  raw_text: string | null
  word_count: number
  known_word_count: number
  comprehension_score: number
  processing_status: 'pending' | 'processing' | 'done' | 'error'
  created_at: string
}

export interface ReadinessResult {
  docId: number
  comprehensionScore: number
  totalVocabFound: number
  knownCount: number
  unknownWords: {
    id: number
    chinese: string
    pinyin: string
    meaning: string
    difficulty: number
    importance_score: number
    card_state: string
  }[]
}

export interface EnrichedWord extends Word {
  card_state: 'new' | 'learning' | 'review' | 'mastered'
  next_due: string
  total_reviews: number
  correct_reviews: number
}

export interface Statistic {
  id: number
  date: string
  words_reviewed: number
  words_correct: number
  xp_earned: number
  study_time_ms: number
  new_words_learned: number
}
