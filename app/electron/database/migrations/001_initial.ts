export const up = `
CREATE TABLE IF NOT EXISTS users (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  total_xp       INTEGER NOT NULL DEFAULT 0,
  level          INTEGER NOT NULL DEFAULT 1,
  streak_days    INTEGER NOT NULL DEFAULT 0,
  last_study_date TEXT,
  daily_xp_goal  INTEGER NOT NULL DEFAULT 50
);

CREATE TABLE IF NOT EXISTS words (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  chinese             TEXT    NOT NULL UNIQUE,
  pinyin              TEXT    NOT NULL DEFAULT '',
  meaning             TEXT    NOT NULL DEFAULT '',
  difficulty          INTEGER NOT NULL DEFAULT 3,
  frequency_score     REAL    NOT NULL DEFAULT 0,
  importance_score    REAL    NOT NULL DEFAULT 0,
  part_of_speech      TEXT,
  example_sentence    TEXT,
  example_translation TEXT,
  source_document_id  INTEGER REFERENCES documents(id) ON DELETE SET NULL,
  created_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cards (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  word_id         INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  card_type       TEXT    NOT NULL CHECK(card_type IN ('zh_to_en','en_to_zh','cloze','reading')),
  state           TEXT    NOT NULL DEFAULT 'new' CHECK(state IN ('new','learning','review','mastered')),
  due             TEXT    NOT NULL DEFAULT (datetime('now')),
  stability       REAL    NOT NULL DEFAULT 0,
  difficulty      REAL    NOT NULL DEFAULT 5,
  elapsed_days    INTEGER NOT NULL DEFAULT 0,
  scheduled_days  INTEGER NOT NULL DEFAULT 0,
  reps            INTEGER NOT NULL DEFAULT 0,
  lapses          INTEGER NOT NULL DEFAULT 0,
  last_review     TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reviews (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id       INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  word_id       INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  rating        INTEGER NOT NULL CHECK(rating IN (1,2,3,4)),
  time_taken_ms INTEGER NOT NULL DEFAULT 0,
  xp_earned     INTEGER NOT NULL DEFAULT 0,
  reviewed_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS achievements (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  key         TEXT    NOT NULL UNIQUE,
  name        TEXT    NOT NULL,
  description TEXT    NOT NULL,
  icon        TEXT    NOT NULL DEFAULT '🏆',
  xp_reward   INTEGER NOT NULL DEFAULT 0,
  unlocked_at TEXT
);

CREATE TABLE IF NOT EXISTS xp_log (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  amount    INTEGER NOT NULL,
  reason    TEXT    NOT NULL,
  earned_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS documents (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  title              TEXT    NOT NULL,
  source_type        TEXT    NOT NULL CHECK(source_type IN ('image','pdf','txt','srt','docx','manual')),
  file_path          TEXT,
  raw_text           TEXT,
  word_count         INTEGER NOT NULL DEFAULT 0,
  known_word_count   INTEGER NOT NULL DEFAULT 0,
  comprehension_score REAL   NOT NULL DEFAULT 0,
  processing_status  TEXT    NOT NULL DEFAULT 'pending' CHECK(processing_status IN ('pending','processing','done','error')),
  created_at         TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS statistics (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  date              TEXT    NOT NULL UNIQUE,
  words_reviewed    INTEGER NOT NULL DEFAULT 0,
  words_correct     INTEGER NOT NULL DEFAULT 0,
  xp_earned         INTEGER NOT NULL DEFAULT 0,
  study_time_ms     INTEGER NOT NULL DEFAULT 0,
  new_words_learned INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_cards_due      ON cards(due);
CREATE INDEX IF NOT EXISTS idx_cards_state    ON cards(state);
CREATE INDEX IF NOT EXISTS idx_reviews_card   ON reviews(card_id);
CREATE INDEX IF NOT EXISTS idx_words_chinese  ON words(chinese);
CREATE INDEX IF NOT EXISTS idx_statistics_date ON statistics(date);
`

export const version = 1
