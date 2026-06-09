import type { SeedEntry } from './hiragana'

// ─── Basic consonants — 14 자음 ───────────────────────────────────────────────

const BASIC_CONSONANTS: SeedEntry[] = [
  { char: 'ㄱ', romaji: 'g/k',  meaning: 'Basic consonant; soft /g/ at syllable start, unaspirated /k/ at end', category: 'Education & Culture', difficulty: 1, frequency: 100 },
  { char: 'ㄴ', romaji: 'n',    meaning: 'Basic consonant; /n/ sound, nasal', category: 'Education & Culture', difficulty: 1, frequency: 100 },
  { char: 'ㄷ', romaji: 'd/t',  meaning: 'Basic consonant; soft /d/ at syllable start, unaspirated /t/ at end', category: 'Education & Culture', difficulty: 1, frequency: 100 },
  { char: 'ㄹ', romaji: 'r/l',  meaning: 'Basic consonant; flapped /r/ between vowels, /l/ at syllable end', category: 'Education & Culture', difficulty: 1, frequency: 100 },
  { char: 'ㅁ', romaji: 'm',    meaning: 'Basic consonant; /m/ sound, bilabial nasal', category: 'Education & Culture', difficulty: 1, frequency: 100 },
  { char: 'ㅂ', romaji: 'b/p',  meaning: 'Basic consonant; soft /b/ at syllable start, unaspirated /p/ at end', category: 'Education & Culture', difficulty: 1, frequency: 100 },
  { char: 'ㅅ', romaji: 's',    meaning: 'Basic consonant; /s/ sound, becomes /sh/ before i/y', category: 'Education & Culture', difficulty: 1, frequency: 100 },
  { char: 'ㅇ', romaji: '-/ng', meaning: 'Basic consonant; silent placeholder when starting a syllable, /ng/ nasal when ending one', category: 'Education & Culture', difficulty: 1, frequency: 100 },
  { char: 'ㅈ', romaji: 'j',    meaning: 'Basic consonant; /j/ (affricate) sound', category: 'Education & Culture', difficulty: 1, frequency: 100 },
  { char: 'ㅊ', romaji: 'ch',   meaning: 'Aspirated consonant; strongly breathed /ch/ sound', category: 'Education & Culture', difficulty: 1, frequency: 98 },
  { char: 'ㅋ', romaji: 'k',    meaning: 'Aspirated consonant; strongly breathed /k/ sound', category: 'Education & Culture', difficulty: 1, frequency: 98 },
  { char: 'ㅌ', romaji: 't',    meaning: 'Aspirated consonant; strongly breathed /t/ sound', category: 'Education & Culture', difficulty: 1, frequency: 98 },
  { char: 'ㅍ', romaji: 'p',    meaning: 'Aspirated consonant; strongly breathed /p/ sound', category: 'Education & Culture', difficulty: 1, frequency: 98 },
  { char: 'ㅎ', romaji: 'h',    meaning: 'Basic consonant; /h/ sound, breathy at syllable start', category: 'Education & Culture', difficulty: 1, frequency: 100 },
]

// ─── Double consonants — 5 쌍자음 ────────────────────────────────────────────

const DOUBLE_CONSONANTS: SeedEntry[] = [
  { char: 'ㄲ', romaji: 'kk',   meaning: 'Tense consonant; hard, unaspirated /kk/ — tense version of ㄱ', category: 'Education & Culture', difficulty: 2, frequency: 90 },
  { char: 'ㄸ', romaji: 'tt',   meaning: 'Tense consonant; hard, unaspirated /tt/ — tense version of ㄷ', category: 'Education & Culture', difficulty: 2, frequency: 90 },
  { char: 'ㅃ', romaji: 'pp',   meaning: 'Tense consonant; hard, unaspirated /pp/ — tense version of ㅂ', category: 'Education & Culture', difficulty: 2, frequency: 90 },
  { char: 'ㅆ', romaji: 'ss',   meaning: 'Tense consonant; hard, tensed /ss/ — tense version of ㅅ', category: 'Education & Culture', difficulty: 2, frequency: 90 },
  { char: 'ㅉ', romaji: 'jj',   meaning: 'Tense consonant; hard, tensed /jj/ — tense version of ㅈ', category: 'Education & Culture', difficulty: 2, frequency: 88 },
]

// ─── Basic vowels — 10 기본 모음 ──────────────────────────────────────────────

const BASIC_VOWELS: SeedEntry[] = [
  { char: 'ㅏ', romaji: 'a',    meaning: 'Basic vowel; open /a/ sound as in "father"', category: 'Education & Culture', difficulty: 1, frequency: 100 },
  { char: 'ㅑ', romaji: 'ya',   meaning: 'Basic vowel; /ya/ sound as in "yard"', category: 'Education & Culture', difficulty: 1, frequency: 95 },
  { char: 'ㅓ', romaji: 'eo',   meaning: 'Basic vowel; open back /ʌ/ sound, like "uh" with rounded lips', category: 'Education & Culture', difficulty: 1, frequency: 100 },
  { char: 'ㅕ', romaji: 'yeo',  meaning: 'Basic vowel; /yʌ/ sound, like "yuh"', category: 'Education & Culture', difficulty: 1, frequency: 95 },
  { char: 'ㅗ', romaji: 'o',    meaning: 'Basic vowel; rounded /o/ sound as in "go"', category: 'Education & Culture', difficulty: 1, frequency: 100 },
  { char: 'ㅛ', romaji: 'yo',   meaning: 'Basic vowel; /yo/ sound as in "yoga"', category: 'Education & Culture', difficulty: 1, frequency: 95 },
  { char: 'ㅜ', romaji: 'u',    meaning: 'Basic vowel; rounded /u/ sound as in "moon"', category: 'Education & Culture', difficulty: 1, frequency: 100 },
  { char: 'ㅠ', romaji: 'yu',   meaning: 'Basic vowel; /yu/ sound as in "you"', category: 'Education & Culture', difficulty: 1, frequency: 95 },
  { char: 'ㅡ', romaji: 'eu',   meaning: 'Basic vowel; unrounded back vowel /ɯ/, no English equivalent — lips spread flat', category: 'Education & Culture', difficulty: 2, frequency: 100 },
  { char: 'ㅣ', romaji: 'i',    meaning: 'Basic vowel; front /i/ sound as in "see"', category: 'Education & Culture', difficulty: 1, frequency: 100 },
]

// ─── Compound vowels — 11 이중 모음 ──────────────────────────────────────────

const COMPOUND_VOWELS: SeedEntry[] = [
  { char: 'ㅐ', romaji: 'ae',   meaning: 'Compound vowel; /ɛ/ sound as in "bed" (combination of a + i)', category: 'Education & Culture', difficulty: 2, frequency: 92 },
  { char: 'ㅒ', romaji: 'yae',  meaning: 'Compound vowel; /yɛ/ sound as in "yes" with open e (combination of ya + i)', category: 'Education & Culture', difficulty: 2, frequency: 80 },
  { char: 'ㅔ', romaji: 'e',    meaning: 'Compound vowel; /e/ sound as in "bed" (combination of eo + i)', category: 'Education & Culture', difficulty: 2, frequency: 92 },
  { char: 'ㅖ', romaji: 'ye',   meaning: 'Compound vowel; /ye/ sound as in "yes" (combination of yeo + i)', category: 'Education & Culture', difficulty: 2, frequency: 82 },
  { char: 'ㅘ', romaji: 'wa',   meaning: 'Compound vowel; /wa/ sound as in "water" (combination of o + a)', category: 'Education & Culture', difficulty: 2, frequency: 88 },
  { char: 'ㅙ', romaji: 'wae',  meaning: 'Compound vowel; /wɛ/ sound as in "wet" with w- (combination of o + ae)', category: 'Education & Culture', difficulty: 3, frequency: 75 },
  { char: 'ㅚ', romaji: 'oe',   meaning: 'Compound vowel; /we/ sound, pronounced like "weh" (combination of o + i)', category: 'Education & Culture', difficulty: 3, frequency: 78 },
  { char: 'ㅝ', romaji: 'wo',   meaning: 'Compound vowel; /wʌ/ sound as in "won" (combination of u + eo)', category: 'Education & Culture', difficulty: 2, frequency: 85 },
  { char: 'ㅞ', romaji: 'we',   meaning: 'Compound vowel; /we/ sound as in "wet" (combination of u + e)', category: 'Education & Culture', difficulty: 3, frequency: 73 },
  { char: 'ㅟ', romaji: 'wi',   meaning: 'Compound vowel; /wi/ sound as in "we" (combination of u + i)', category: 'Education & Culture', difficulty: 2, frequency: 82 },
  { char: 'ㅢ', romaji: 'ui',   meaning: 'Compound vowel; /ɰi/ sound unique to Korean, also used as the possessive particle "of" (combination of eu + i)', category: 'Education & Culture', difficulty: 3, frequency: 90 },
]

// ─── Full export ──────────────────────────────────────────────────────────────

export const KOREAN_JAMO_ENTRIES: SeedEntry[] = [
  ...BASIC_CONSONANTS,
  ...DOUBLE_CONSONANTS,
  ...BASIC_VOWELS,
  ...COMPOUND_VOWELS,
]
