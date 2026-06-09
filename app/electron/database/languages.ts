export type LanguageCode = 'chinese' | 'japanese' | 'korean'

export interface LanguageConfig {
  code: LanguageCode
  name: string
  nativeName: string
  flag: string
  ocrLangs: string[]           // Tesseract language codes
  readingLabel: string         // label for the pinyin/furigana/romanization field
  fontFamily: string           // Google Font name for the script
  fontClass: string            // CSS class or inline font-family value
  charLabel: string            // what to call the target-language word ("Character", "Word", etc.)
  color: string                // brand accent for this language in charts
  extractionNotes: string      // instructions injected into the Claude extraction prompt
}

export const LANGUAGE_CONFIGS: Record<LanguageCode, LanguageConfig> = {
  chinese: {
    code: 'chinese',
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
    ocrLangs: ['eng', 'chi_sim'],
    readingLabel: 'Pinyin',
    fontFamily: 'Noto Sans SC',
    fontClass: 'font-chinese',
    charLabel: 'Character',
    color: '#E8B84B',
    extractionNotes: `
- "chinese": the Chinese word/phrase (simplified characters)
- "pinyin": standard tone-marked pinyin (e.g. "nǐ hǎo")
- "meaning": concise English definition`,
  },
  japanese: {
    code: 'japanese',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    ocrLangs: ['eng', 'jpn'],
    readingLabel: 'Romaji',
    fontFamily: 'Noto Sans JP',
    fontClass: 'font-japanese',
    charLabel: 'Word',
    color: '#BC4E9C',
    extractionNotes: `
- "chinese": the Japanese word written ENTIRELY in hiragana (no kanji/katakana)
- "pinyin": Hepburn romanization of the word in plain English letters (e.g. "nihongo", "benkyou") — NO hiragana/kanji, only romaji
- "meaning": concise English definition`,
  },
  korean: {
    code: 'korean',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    ocrLangs: ['eng', 'kor'],
    readingLabel: 'Romanization',
    fontFamily: 'Noto Sans KR',
    fontClass: 'font-korean',
    charLabel: 'Word',
    color: '#3E92CC',
    extractionNotes: `
- "chinese": the Korean word written ENTIRELY in hangul (no hanja/CJK characters)
- "pinyin": Revised Romanization of Korean in plain Latin letters ONLY — a-z, no hangul (e.g. "annyeong", "gongbu", "haengbok")
- "meaning": concise English definition`,
  },
}

export const LANGUAGE_CODES = Object.keys(LANGUAGE_CONFIGS) as LanguageCode[]

export function getLanguageConfig(code: LanguageCode): LanguageConfig {
  return LANGUAGE_CONFIGS[code]
}
