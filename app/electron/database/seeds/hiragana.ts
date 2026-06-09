export interface SeedEntry {
  char: string
  romaji: string
  meaning: string
  category: string
  difficulty: number
  frequency: number
}

// ─── Basic 46 ─────────────────────────────────────────────────────────────────

const VOWELS: SeedEntry[] = [
  { char: 'あ', romaji: 'a',   meaning: 'Hiragana vowel — the /a/ sound', category: 'Education & Culture', difficulty: 1, frequency: 100 },
  { char: 'い', romaji: 'i',   meaning: 'Hiragana vowel — the /i/ sound', category: 'Education & Culture', difficulty: 1, frequency: 100 },
  { char: 'う', romaji: 'u',   meaning: 'Hiragana vowel — the /u/ sound', category: 'Education & Culture', difficulty: 1, frequency: 100 },
  { char: 'え', romaji: 'e',   meaning: 'Hiragana vowel — the /e/ sound', category: 'Education & Culture', difficulty: 1, frequency: 100 },
  { char: 'お', romaji: 'o',   meaning: 'Hiragana vowel — the /o/ sound', category: 'Education & Culture', difficulty: 1, frequency: 100 },
]

const K_ROW: SeedEntry[] = [
  { char: 'か', romaji: 'ka',  meaning: 'Hiragana k-row — /ka/', category: 'Education & Culture', difficulty: 1, frequency: 98 },
  { char: 'き', romaji: 'ki',  meaning: 'Hiragana k-row — /ki/', category: 'Education & Culture', difficulty: 1, frequency: 98 },
  { char: 'く', romaji: 'ku',  meaning: 'Hiragana k-row — /ku/', category: 'Education & Culture', difficulty: 1, frequency: 98 },
  { char: 'け', romaji: 'ke',  meaning: 'Hiragana k-row — /ke/', category: 'Education & Culture', difficulty: 1, frequency: 98 },
  { char: 'こ', romaji: 'ko',  meaning: 'Hiragana k-row — /ko/', category: 'Education & Culture', difficulty: 1, frequency: 98 },
]

const S_ROW: SeedEntry[] = [
  { char: 'さ', romaji: 'sa',  meaning: 'Hiragana s-row — /sa/',  category: 'Education & Culture', difficulty: 1, frequency: 98 },
  { char: 'し', romaji: 'shi', meaning: 'Hiragana s-row — /shi/', category: 'Education & Culture', difficulty: 1, frequency: 98 },
  { char: 'す', romaji: 'su',  meaning: 'Hiragana s-row — /su/',  category: 'Education & Culture', difficulty: 1, frequency: 98 },
  { char: 'せ', romaji: 'se',  meaning: 'Hiragana s-row — /se/',  category: 'Education & Culture', difficulty: 1, frequency: 98 },
  { char: 'そ', romaji: 'so',  meaning: 'Hiragana s-row — /so/',  category: 'Education & Culture', difficulty: 1, frequency: 98 },
]

const T_ROW: SeedEntry[] = [
  { char: 'た', romaji: 'ta',  meaning: 'Hiragana t-row — /ta/',  category: 'Education & Culture', difficulty: 1, frequency: 98 },
  { char: 'ち', romaji: 'chi', meaning: 'Hiragana t-row — /chi/', category: 'Education & Culture', difficulty: 1, frequency: 98 },
  { char: 'つ', romaji: 'tsu', meaning: 'Hiragana t-row — /tsu/', category: 'Education & Culture', difficulty: 1, frequency: 98 },
  { char: 'て', romaji: 'te',  meaning: 'Hiragana t-row — /te/',  category: 'Education & Culture', difficulty: 1, frequency: 98 },
  { char: 'と', romaji: 'to',  meaning: 'Hiragana t-row — /to/',  category: 'Education & Culture', difficulty: 1, frequency: 98 },
]

const N_ROW: SeedEntry[] = [
  { char: 'な', romaji: 'na',  meaning: 'Hiragana n-row — /na/', category: 'Education & Culture', difficulty: 1, frequency: 98 },
  { char: 'に', romaji: 'ni',  meaning: 'Hiragana n-row — /ni/', category: 'Education & Culture', difficulty: 1, frequency: 98 },
  { char: 'ぬ', romaji: 'nu',  meaning: 'Hiragana n-row — /nu/', category: 'Education & Culture', difficulty: 1, frequency: 98 },
  { char: 'ね', romaji: 'ne',  meaning: 'Hiragana n-row — /ne/', category: 'Education & Culture', difficulty: 1, frequency: 98 },
  { char: 'の', romaji: 'no',  meaning: 'Hiragana n-row — /no/; also the possessive particle "of"', category: 'Education & Culture', difficulty: 1, frequency: 100 },
]

const H_ROW: SeedEntry[] = [
  { char: 'は', romaji: 'ha',  meaning: 'Hiragana h-row — /ha/; also the topic particle "wa"', category: 'Education & Culture', difficulty: 1, frequency: 100 },
  { char: 'ひ', romaji: 'hi',  meaning: 'Hiragana h-row — /hi/', category: 'Education & Culture', difficulty: 1, frequency: 98 },
  { char: 'ふ', romaji: 'fu',  meaning: 'Hiragana h-row — /fu/', category: 'Education & Culture', difficulty: 1, frequency: 98 },
  { char: 'へ', romaji: 'he',  meaning: 'Hiragana h-row — /he/; also the direction particle "e"', category: 'Education & Culture', difficulty: 1, frequency: 98 },
  { char: 'ほ', romaji: 'ho',  meaning: 'Hiragana h-row — /ho/', category: 'Education & Culture', difficulty: 1, frequency: 98 },
]

const M_ROW: SeedEntry[] = [
  { char: 'ま', romaji: 'ma',  meaning: 'Hiragana m-row — /ma/', category: 'Education & Culture', difficulty: 1, frequency: 98 },
  { char: 'み', romaji: 'mi',  meaning: 'Hiragana m-row — /mi/', category: 'Education & Culture', difficulty: 1, frequency: 98 },
  { char: 'む', romaji: 'mu',  meaning: 'Hiragana m-row — /mu/', category: 'Education & Culture', difficulty: 1, frequency: 98 },
  { char: 'め', romaji: 'me',  meaning: 'Hiragana m-row — /me/', category: 'Education & Culture', difficulty: 1, frequency: 98 },
  { char: 'も', romaji: 'mo',  meaning: 'Hiragana m-row — /mo/; also the particle "too / also"', category: 'Education & Culture', difficulty: 1, frequency: 98 },
]

const Y_ROW: SeedEntry[] = [
  { char: 'や', romaji: 'ya',  meaning: 'Hiragana y-row — /ya/', category: 'Education & Culture', difficulty: 1, frequency: 98 },
  { char: 'ゆ', romaji: 'yu',  meaning: 'Hiragana y-row — /yu/', category: 'Education & Culture', difficulty: 1, frequency: 98 },
  { char: 'よ', romaji: 'yo',  meaning: 'Hiragana y-row — /yo/', category: 'Education & Culture', difficulty: 1, frequency: 98 },
]

const R_ROW: SeedEntry[] = [
  { char: 'ら', romaji: 'ra',  meaning: 'Hiragana r-row — /ra/', category: 'Education & Culture', difficulty: 1, frequency: 98 },
  { char: 'り', romaji: 'ri',  meaning: 'Hiragana r-row — /ri/', category: 'Education & Culture', difficulty: 1, frequency: 98 },
  { char: 'る', romaji: 'ru',  meaning: 'Hiragana r-row — /ru/', category: 'Education & Culture', difficulty: 1, frequency: 98 },
  { char: 'れ', romaji: 're',  meaning: 'Hiragana r-row — /re/', category: 'Education & Culture', difficulty: 1, frequency: 98 },
  { char: 'ろ', romaji: 'ro',  meaning: 'Hiragana r-row — /ro/', category: 'Education & Culture', difficulty: 1, frequency: 98 },
]

const W_ROW: SeedEntry[] = [
  { char: 'わ', romaji: 'wa',  meaning: 'Hiragana w-row — /wa/', category: 'Education & Culture', difficulty: 1, frequency: 98 },
  { char: 'を', romaji: 'wo',  meaning: 'Hiragana w-row — /wo/; used only as the object particle', category: 'Education & Culture', difficulty: 1, frequency: 100 },
  { char: 'ん', romaji: 'n',   meaning: 'Hiragana nasal — /n/; stands alone as a syllable', category: 'Education & Culture', difficulty: 1, frequency: 100 },
]

// ─── Dakuten — voiced (20) ────────────────────────────────────────────────────

const DAKUTEN: SeedEntry[] = [
  { char: 'が', romaji: 'ga',  meaning: 'Hiragana g-row (voiced か) — /ga/', category: 'Education & Culture', difficulty: 1, frequency: 96 },
  { char: 'ぎ', romaji: 'gi',  meaning: 'Hiragana g-row (voiced き) — /gi/', category: 'Education & Culture', difficulty: 1, frequency: 96 },
  { char: 'ぐ', romaji: 'gu',  meaning: 'Hiragana g-row (voiced く) — /gu/', category: 'Education & Culture', difficulty: 1, frequency: 96 },
  { char: 'げ', romaji: 'ge',  meaning: 'Hiragana g-row (voiced け) — /ge/', category: 'Education & Culture', difficulty: 1, frequency: 96 },
  { char: 'ご', romaji: 'go',  meaning: 'Hiragana g-row (voiced こ) — /go/', category: 'Education & Culture', difficulty: 1, frequency: 96 },
  { char: 'ざ', romaji: 'za',  meaning: 'Hiragana z-row (voiced さ) — /za/', category: 'Education & Culture', difficulty: 1, frequency: 96 },
  { char: 'じ', romaji: 'ji',  meaning: 'Hiragana z-row (voiced し) — /ji/', category: 'Education & Culture', difficulty: 1, frequency: 96 },
  { char: 'ず', romaji: 'zu',  meaning: 'Hiragana z-row (voiced す) — /zu/', category: 'Education & Culture', difficulty: 1, frequency: 96 },
  { char: 'ぜ', romaji: 'ze',  meaning: 'Hiragana z-row (voiced せ) — /ze/', category: 'Education & Culture', difficulty: 1, frequency: 96 },
  { char: 'ぞ', romaji: 'zo',  meaning: 'Hiragana z-row (voiced そ) — /zo/', category: 'Education & Culture', difficulty: 1, frequency: 96 },
  { char: 'だ', romaji: 'da',  meaning: 'Hiragana d-row (voiced た) — /da/; also the copula "is/are"', category: 'Education & Culture', difficulty: 1, frequency: 100 },
  { char: 'ぢ', romaji: 'di',  meaning: 'Hiragana d-row (voiced ち) — /di/ (rare)', category: 'Education & Culture', difficulty: 2, frequency: 70 },
  { char: 'づ', romaji: 'du',  meaning: 'Hiragana d-row (voiced つ) — /du/ (rare)', category: 'Education & Culture', difficulty: 2, frequency: 70 },
  { char: 'で', romaji: 'de',  meaning: 'Hiragana d-row (voiced て) — /de/; also the location/means particle', category: 'Education & Culture', difficulty: 1, frequency: 100 },
  { char: 'ど', romaji: 'do',  meaning: 'Hiragana d-row (voiced と) — /do/', category: 'Education & Culture', difficulty: 1, frequency: 96 },
  { char: 'ば', romaji: 'ba',  meaning: 'Hiragana b-row (voiced は) — /ba/', category: 'Education & Culture', difficulty: 1, frequency: 96 },
  { char: 'び', romaji: 'bi',  meaning: 'Hiragana b-row (voiced ひ) — /bi/', category: 'Education & Culture', difficulty: 1, frequency: 96 },
  { char: 'ぶ', romaji: 'bu',  meaning: 'Hiragana b-row (voiced ふ) — /bu/', category: 'Education & Culture', difficulty: 1, frequency: 96 },
  { char: 'べ', romaji: 'be',  meaning: 'Hiragana b-row (voiced へ) — /be/', category: 'Education & Culture', difficulty: 1, frequency: 96 },
  { char: 'ぼ', romaji: 'bo',  meaning: 'Hiragana b-row (voiced ほ) — /bo/', category: 'Education & Culture', difficulty: 1, frequency: 96 },
]

// ─── Handakuten — semi-voiced (5) ─────────────────────────────────────────────

const HANDAKUTEN: SeedEntry[] = [
  { char: 'ぱ', romaji: 'pa',  meaning: 'Hiragana p-row (semi-voiced は) — /pa/', category: 'Education & Culture', difficulty: 1, frequency: 92 },
  { char: 'ぴ', romaji: 'pi',  meaning: 'Hiragana p-row (semi-voiced ひ) — /pi/', category: 'Education & Culture', difficulty: 1, frequency: 92 },
  { char: 'ぷ', romaji: 'pu',  meaning: 'Hiragana p-row (semi-voiced ふ) — /pu/', category: 'Education & Culture', difficulty: 1, frequency: 92 },
  { char: 'ぺ', romaji: 'pe',  meaning: 'Hiragana p-row (semi-voiced へ) — /pe/', category: 'Education & Culture', difficulty: 1, frequency: 92 },
  { char: 'ぽ', romaji: 'po',  meaning: 'Hiragana p-row (semi-voiced ほ) — /po/', category: 'Education & Culture', difficulty: 1, frequency: 92 },
]

// ─── Combination characters — yōon (33) ──────────────────────────────────────

const COMBINATIONS: SeedEntry[] = [
  // ki combinations
  { char: 'きゃ', romaji: 'kya', meaning: 'Hiragana combination き + や — /kya/', category: 'Education & Culture', difficulty: 2, frequency: 88 },
  { char: 'きゅ', romaji: 'kyu', meaning: 'Hiragana combination き + ゆ — /kyu/', category: 'Education & Culture', difficulty: 2, frequency: 88 },
  { char: 'きょ', romaji: 'kyo', meaning: 'Hiragana combination き + よ — /kyo/', category: 'Education & Culture', difficulty: 2, frequency: 88 },
  // shi combinations
  { char: 'しゃ', romaji: 'sha', meaning: 'Hiragana combination し + や — /sha/', category: 'Education & Culture', difficulty: 2, frequency: 90 },
  { char: 'しゅ', romaji: 'shu', meaning: 'Hiragana combination し + ゆ — /shu/', category: 'Education & Culture', difficulty: 2, frequency: 90 },
  { char: 'しょ', romaji: 'sho', meaning: 'Hiragana combination し + よ — /sho/', category: 'Education & Culture', difficulty: 2, frequency: 90 },
  // chi combinations
  { char: 'ちゃ', romaji: 'cha', meaning: 'Hiragana combination ち + や — /cha/', category: 'Education & Culture', difficulty: 2, frequency: 90 },
  { char: 'ちゅ', romaji: 'chu', meaning: 'Hiragana combination ち + ゆ — /chu/', category: 'Education & Culture', difficulty: 2, frequency: 90 },
  { char: 'ちょ', romaji: 'cho', meaning: 'Hiragana combination ち + よ — /cho/', category: 'Education & Culture', difficulty: 2, frequency: 90 },
  // ni combinations
  { char: 'にゃ', romaji: 'nya', meaning: 'Hiragana combination に + や — /nya/', category: 'Education & Culture', difficulty: 2, frequency: 85 },
  { char: 'にゅ', romaji: 'nyu', meaning: 'Hiragana combination に + ゆ — /nyu/', category: 'Education & Culture', difficulty: 2, frequency: 85 },
  { char: 'にょ', romaji: 'nyo', meaning: 'Hiragana combination に + よ — /nyo/', category: 'Education & Culture', difficulty: 2, frequency: 85 },
  // hi combinations
  { char: 'ひゃ', romaji: 'hya', meaning: 'Hiragana combination ひ + や — /hya/', category: 'Education & Culture', difficulty: 2, frequency: 85 },
  { char: 'ひゅ', romaji: 'hyu', meaning: 'Hiragana combination ひ + ゆ — /hyu/', category: 'Education & Culture', difficulty: 2, frequency: 82 },
  { char: 'ひょ', romaji: 'hyo', meaning: 'Hiragana combination ひ + よ — /hyo/', category: 'Education & Culture', difficulty: 2, frequency: 85 },
  // mi combinations
  { char: 'みゃ', romaji: 'mya', meaning: 'Hiragana combination み + や — /mya/', category: 'Education & Culture', difficulty: 2, frequency: 82 },
  { char: 'みゅ', romaji: 'myu', meaning: 'Hiragana combination み + ゆ — /myu/', category: 'Education & Culture', difficulty: 2, frequency: 80 },
  { char: 'みょ', romaji: 'myo', meaning: 'Hiragana combination み + よ — /myo/', category: 'Education & Culture', difficulty: 2, frequency: 82 },
  // ri combinations
  { char: 'りゃ', romaji: 'rya', meaning: 'Hiragana combination り + や — /rya/', category: 'Education & Culture', difficulty: 2, frequency: 82 },
  { char: 'りゅ', romaji: 'ryu', meaning: 'Hiragana combination り + ゆ — /ryu/', category: 'Education & Culture', difficulty: 2, frequency: 85 },
  { char: 'りょ', romaji: 'ryo', meaning: 'Hiragana combination り + よ — /ryo/', category: 'Education & Culture', difficulty: 2, frequency: 85 },
  // gi combinations (voiced)
  { char: 'ぎゃ', romaji: 'gya', meaning: 'Hiragana voiced combination ぎ + や — /gya/', category: 'Education & Culture', difficulty: 2, frequency: 82 },
  { char: 'ぎゅ', romaji: 'gyu', meaning: 'Hiragana voiced combination ぎ + ゆ — /gyu/', category: 'Education & Culture', difficulty: 2, frequency: 82 },
  { char: 'ぎょ', romaji: 'gyo', meaning: 'Hiragana voiced combination ぎ + よ — /gyo/', category: 'Education & Culture', difficulty: 2, frequency: 82 },
  // ji combinations (voiced)
  { char: 'じゃ', romaji: 'ja',  meaning: 'Hiragana voiced combination じ + や — /ja/', category: 'Education & Culture', difficulty: 2, frequency: 90 },
  { char: 'じゅ', romaji: 'ju',  meaning: 'Hiragana voiced combination じ + ゆ — /ju/', category: 'Education & Culture', difficulty: 2, frequency: 88 },
  { char: 'じょ', romaji: 'jo',  meaning: 'Hiragana voiced combination じ + よ — /jo/', category: 'Education & Culture', difficulty: 2, frequency: 88 },
  // bi combinations (voiced)
  { char: 'びゃ', romaji: 'bya', meaning: 'Hiragana voiced combination び + や — /bya/', category: 'Education & Culture', difficulty: 2, frequency: 80 },
  { char: 'びゅ', romaji: 'byu', meaning: 'Hiragana voiced combination び + ゆ — /byu/', category: 'Education & Culture', difficulty: 2, frequency: 78 },
  { char: 'びょ', romaji: 'byo', meaning: 'Hiragana voiced combination び + よ — /byo/', category: 'Education & Culture', difficulty: 2, frequency: 80 },
  // pi combinations (semi-voiced)
  { char: 'ぴゃ', romaji: 'pya', meaning: 'Hiragana semi-voiced combination ぴ + や — /pya/', category: 'Education & Culture', difficulty: 2, frequency: 75 },
  { char: 'ぴゅ', romaji: 'pyu', meaning: 'Hiragana semi-voiced combination ぴ + ゆ — /pyu/', category: 'Education & Culture', difficulty: 2, frequency: 73 },
  { char: 'ぴょ', romaji: 'pyo', meaning: 'Hiragana semi-voiced combination ぴ + よ — /pyo/', category: 'Education & Culture', difficulty: 2, frequency: 75 },
]

// ─── Full export ──────────────────────────────────────────────────────────────

export const HIRAGANA_ENTRIES: SeedEntry[] = [
  ...VOWELS,
  ...K_ROW, ...S_ROW, ...T_ROW, ...N_ROW, ...H_ROW,
  ...M_ROW, ...Y_ROW, ...R_ROW, ...W_ROW,
  ...DAKUTEN,
  ...HANDAKUTEN,
  ...COMBINATIONS,
]
