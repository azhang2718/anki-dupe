import type { LanguageCode } from '../database/languages'

/**
 * Returns true if `word` is written in the correct script for the given language.
 *
 * Chinese  — must contain at least one CJK character; must NOT contain hiragana or hangul
 * Japanese — must contain ONLY hiragana (± whitespace/punctuation); no kanji / katakana / hangul
 * Korean   — must contain ONLY hangul syllables/jamo (± whitespace/punctuation); no CJK / hanja
 */
export function isValidScript(word: string, lang: LanguageCode): boolean {
  if (!word || !word.trim()) return false
  switch (lang) {
    case 'chinese':  return isValidChinese(word)
    case 'japanese': return isValidJapanese(word)
    case 'korean':   return isValidKorean(word)
    default:         return true
  }
}

// ─── Script ranges ────────────────────────────────────────────────────────────

// CJK Unified Ideographs (basic block + Extension A + Compatibility block)
const reCJK      = /[一-鿿㐀-䶿豈-﫿]/
// Hiragana
const reHiragana = /[ぁ-ゟ]/
// Katakana
const reKatakana = /[゠-ヿ]/
// Hangul syllables + Jamo + Compatibility Jamo
const reHangul   = /[가-힯ᄀ-ᇿ㄰-㆏]/

// ─── Per-language validators ──────────────────────────────────────────────────

function isValidChinese(word: string): boolean {
  // Must contain at least one CJK character
  if (!reCJK.test(word)) return false
  // Must NOT contain hiragana or hangul (these would be wrong-language imports)
  if (reHiragana.test(word) || reHangul.test(word)) return false
  return true
}

function isValidJapanese(word: string): boolean {
  // Reject anything with CJK (kanji), katakana, or hangul
  if (reCJK.test(word) || reKatakana.test(word) || reHangul.test(word)) return false
  // Must contain at least one hiragana character
  if (!reHiragana.test(word)) return false
  // After stripping hiragana and allowed punctuation/whitespace, nothing should remain
  const stripped = word.replace(/[ぁ-ゟ　-〿゛゜\s]/g, '')
  return stripped.length === 0
}

function isValidKorean(word: string): boolean {
  // Reject anything with CJK (hanja), hiragana, or katakana
  if (reCJK.test(word) || reHiragana.test(word) || reKatakana.test(word)) return false
  // Must contain at least one hangul character
  if (!reHangul.test(word)) return false
  // After stripping hangul and allowed punctuation/whitespace, nothing should remain
  const stripped = word.replace(/[가-힯ᄀ-ᇿ㄰-㆏　-〿\s]/g, '')
  return stripped.length === 0
}
