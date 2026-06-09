// Renderer-side language config — mirrors electron/database/languages.ts
// Do NOT import from electron/ in the renderer; use this instead.

export type LanguageCode = 'chinese' | 'japanese' | 'korean'

export interface LanguageConfig {
  code: LanguageCode
  name: string
  nativeName: string
  flag: string
  readingLabel: string
  charLabel: string
  color: string
  fontFamily: string
}

export const LANGUAGE_CONFIGS: Record<LanguageCode, LanguageConfig> = {
  chinese: {
    code: 'chinese',
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
    readingLabel: 'Pinyin',
    charLabel: 'Character',
    color: '#E8B84B',
    fontFamily: '"Noto Sans SC", sans-serif',
  },
  japanese: {
    code: 'japanese',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    readingLabel: 'Romaji',
    charLabel: 'Word',
    color: '#BC4E9C',
    fontFamily: '"Noto Sans JP", sans-serif',
  },
  korean: {
    code: 'korean',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    readingLabel: 'Romanization',
    charLabel: 'Word',
    color: '#3E92CC',
    fontFamily: '"Noto Sans KR", sans-serif',
  },
}

export const LANGUAGE_CODES = Object.keys(LANGUAGE_CONFIGS) as LanguageCode[]
