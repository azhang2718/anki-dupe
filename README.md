# Anki Dupe

A local-first desktop flashcard app for learning Chinese, Japanese, and Korean vocabulary. Import real content — PDFs, images, subtitles, documents — and let Claude AI extract the vocabulary worth studying. Cards are scheduled with the FSRS-4.5 spaced repetition algorithm so you review words at exactly the right moment.

Everything runs on your machine. No account, no cloud sync, no data sent anywhere except the Anthropic API when you extract vocabulary.

---

## Features

- **Multi-language support** — Chinese (Simplified), Japanese (hiragana), and Korean (hangul), each stored in a separate database. Switch languages in Settings at any time.
- **Smart import pipeline** — Drop in a PDF, image, `.srt` subtitle file, `.docx`, or plain text. OCR (Tesseract) extracts text from images; Claude Haiku extracts the vocabulary worth learning from any source.
- **FSRS-4.5 scheduling** — Each word has three card types (recognition, recall, fill-in-the-blank). The scheduler predicts memory decay and surfaces cards at the optimal moment.
- **Handwriting recognition** — Draw a character on the canvas; Tesseract OCR identifies it and matches it against your vocabulary bank.
- **Reading readiness** — Paste in any document and see your comprehension score: how many of the vocabulary words in it you already know.
- **Statistics** — 30-day word-learning and mastery charts, cross-language view, review accuracy, and daily streaks.
- **Floating widget** — A compact always-on-top overlay for reviewing cards without leaving your current app.
- **Pre-seeded alphabets** — Japanese and Korean databases are pre-populated with the full hiragana chart and all Korean jamo as vocab entries so you can start from the basics.
- **Offline mode** — Toggle off the Claude API to study without internet.

---

## Stack

| Layer | Technology |
|---|---|
| Desktop shell | Electron 31 |
| Build tool | electron-vite + Vite 5 |
| UI | React 18, TypeScript, Tailwind CSS v3, Framer Motion |
| Icons | Phosphor Icons |
| Charts | Recharts |
| State | Zustand |
| Database | better-sqlite3 (SQLite) |
| AI extraction | Anthropic SDK — Claude Haiku (`claude-haiku-4-5-20251001`) |
| OCR | Tesseract.js v7 |
| Document parsing | pdf-parse, mammoth (docx), native txt/srt |
| Spaced repetition | Custom FSRS-4.5 implementation |
| Testing | Vitest |

---

## Architecture

```
anki-dupe/app/
├── electron/                   # Main process (Node.js / Electron)
│   ├── main/index.ts           # App entry point — BrowserWindow, tray, widget window
│   ├── preload/index.ts        # Context bridge — exposes typed APIs to renderer
│   ├── ipc/                    # IPC handlers (one file per domain)
│   │   ├── dbHandlers.ts       # words, cards, reviews, stats, language switching
│   │   ├── claudeHandlers.ts   # vocabulary extraction, character identification
│   │   ├── importHandlers.ts   # file import, OCR pipeline, document processing
│   │   ├── ocrHandlers.ts      # handwriting canvas → Tesseract → vocab lookup
│   │   ├── widgetHandlers.ts   # floating widget window management
│   │   └── windowHandlers.ts   # minimize / maximize / close
│   ├── database/
│   │   ├── db.ts               # Multi-language DB manager (one SQLite per language)
│   │   ├── settingsDb.ts       # Global settings DB (API key, active language, limits)
│   │   ├── schema.ts           # Shared TypeScript interfaces for all DB entities
│   │   ├── languages.ts        # Language configs (OCR langs, fonts, prompts, colors)
│   │   ├── migrations/         # Sequential SQL migrations (001–004)
│   │   ├── seeds/              # Alphabet pre-seeding for Japanese and Korean
│   │   │   ├── hiragana.ts     # All 109 hiragana entries (basic + dakuten + yōon)
│   │   │   ├── korean.ts       # All 40 Korean jamo (consonants, vowels, compounds)
│   │   │   └── index.ts        # seedAlphabetIfNeeded() — idempotent, runs on DB open
│   │   └── repositories/       # Data access layer (one repo per entity)
│   ├── services/
│   │   ├── claudeService.ts    # Language-aware Claude API calls for vocab extraction
│   │   ├── ocrService.ts       # Tesseract worker management, single-char PSM 10 mode
│   │   ├── docParser.ts        # PDF / DOCX / image / SRT → plain text
│   │   ├── importanceService.ts # Word importance scoring (frequency × difficulty × comprehension gain)
│   │   ├── readingReadinessService.ts # Comprehension analysis for imported documents
│   │   └── achievementChecker.ts  # Unlocks achievements based on study milestones
│   └── utils/
│       ├── fsrs.ts             # FSRS-4.5 scheduling algorithm
│       ├── scriptValidator.ts  # Validates word script matches active language (CJK / hiragana / hangul)
│       ├── backup.ts           # Daily SQLite backup rotation (7 copies)
│       └── logger.ts           # Structured app-level logging
│
└── src/                        # Renderer process (React)
    ├── App.tsx                 # Router + GamificationProvider
    ├── WidgetApp.tsx           # Separate React root for the floating widget
    ├── pages/
    │   ├── DashboardPage.tsx   # Stats overview, due count, quick-start
    │   ├── ReviewPage.tsx      # Full flashcard session with FSRS rating
    │   ├── VocabularyPage.tsx  # Browse, filter, sort, cleanup invalid-script words
    │   ├── ImportPage.tsx      # Upload files, run OCR + Claude extraction
    │   ├── DrawPage.tsx        # Handwriting canvas → OCR character recognition
    │   ├── StatisticsPage.tsx  # 30-day charts, cross-language word history
    │   ├── ReadingReadinessPage.tsx  # Comprehension score for a document
    │   ├── SettingsPage.tsx    # API key, offline mode, language selector
    │   └── WidgetPage.tsx      # Compact review UI for the floating overlay
    ├── components/
    │   ├── flashcards/         # CardZhToEn, CardEnToZh, CardCloze, SessionSummary
    │   ├── ui/                 # Button, Badge, ProgressBar, StatCard, XpBar, …
    │   ├── Sidebar.tsx         # Navigation + active-language indicator
    │   └── TitleBar.tsx        # Custom frameless window title bar
    ├── stores/
    │   └── reviewStore.ts      # Zustand store — session queue, ratings, progress
    ├── types/
    │   ├── db.ts               # Re-exports from electron/database/schema.ts
    │   ├── electron.d.ts       # window.db / window.claudeAPI / window.importAPI types
    │   └── languages.ts        # Renderer-side mirror of LANGUAGE_CONFIGS
    └── utils/
        └── fsrs.ts             # Client-side FSRS (same algorithm, called from widget)
```

### Data layer

Two categories of SQLite databases live in `%APPDATA%/anki-dupe/` (Windows) or `~/Library/Application Support/anki-dupe/` (macOS):

| File | Contents |
|---|---|
| `anki-dupe-settings.sqlite` | API key, offline mode flag, active language, review limit — shared across all languages |
| `anki-dupe-chinese.sqlite` | Words, cards, reviews, documents, stats, achievements for Chinese |
| `anki-dupe-japanese.sqlite` | Same schema, Japanese vocabulary |
| `anki-dupe-korean.sqlite` | Same schema, Korean vocabulary |

Each language DB is opened on demand, runs its own migrations, and seeds its alphabet on first open. The `settingsRepository` always reads from the global settings DB regardless of active language.

### IPC bridge

The renderer never touches the filesystem or SQLite directly. All data access goes through a typed context bridge defined in `preload/index.ts` and consumed as `window.db`, `window.claudeAPI`, and `window.importAPI`. Each IPC channel maps to a handler in `electron/ipc/`.

### Spaced repetition (FSRS-4.5)

Each vocabulary word has three cards: **recognition** (target → English), **recall** (English → target), and **cloze** (fill-in-the-blank from the example sentence). After each review the FSRS algorithm recalculates stability, difficulty, and the next due date. The scheduler is implemented twice — once in the main process (`electron/utils/fsrs.ts`) for the full review page, and once in the renderer (`src/utils/fsrs.ts`) so the widget can schedule cards without an extra IPC round-trip.

### OCR pipeline

Two separate OCR paths use Tesseract.js:

1. **Document import** — PSM 3 (auto page segmentation) on full-page images. Language is set per the active language config (`chi_sim`, `jpn`, or `kor`).
2. **Handwriting recognition** — The canvas is composited onto a white background, cropped to the bounding box of drawn strokes, scaled up to 320 × 320 px with padding, then fed to Tesseract with PSM 10 (single character) + OEM 1 (LSTM only). This maximises accuracy for isolated character recognition.

### Script enforcement

Words are validated against the active language at two points:

- **Extraction prompt** — Language-specific rules are injected into the Claude system prompt (e.g. hiragana-only for Japanese, hangul-only for Korean).
- **Cleanup validator** — `scriptValidator.ts` provides `isValidScript(word, lang)`. The Vocabulary page shows a "Remove N non-X" button that bulk-deletes any words that snuck through with the wrong script.

---

## Getting started

### Prerequisites

- Node.js 20+
- Windows (primary target), macOS, or Linux
- An [Anthropic API key](https://console.anthropic.com/) (optional — app works in offline mode without one)

### Development

```bash
cd app
npm install
npm run dev
```

### Production build

```bash
# Windows installer (.exe / NSIS)
npm run dist:win

# All platforms
npm run dist
```

Output goes to `../release/`.

### Configuration

On first launch, open **Settings** and paste your Anthropic API key. The key is stored only in the local SQLite settings database — it is never written to source code, config files, or environment variables.

---

## Database schema (per language)

```
users         — profile, streak, XP, daily goal
words         — vocabulary entries (target word, reading, meaning, difficulty, importance)
cards         — FSRS card state per word × card type
reviews       — every review event with rating and timing
documents     — imported source files and their processing status
statistics    — daily aggregates (reviewed, correct, new words, study time)
achievements  — milestone badges
_migrations   — applied migration versions
_seeds        — applied seed names (e.g. alphabet_v1)
```

---

## Releasing

The SQLite databases and the `release/` output directory are both git-ignored. To publish a new release:

```bash
npm run dist:win
gh release create v0.x.x ../release/*.exe --title "v0.x.x" --notes "..."
```

The API key never appears in the repository — it lives only in the user's local app data.
