/**
 * FSRS-4.5 — main process copy (mirrors src/utils/fsrs.ts)
 * Used for creating initial cards when words are ingested.
 */

export function createInitialCards(wordId: number) {
  return [
    {
      word_id:        wordId,
      card_type:      'zh_to_en' as const,
      state:          'new' as const,
      due:            new Date().toISOString(),
      stability:      0,
      difficulty:     5,
      elapsed_days:   0,
      scheduled_days: 0,
      reps:           0,
      lapses:         0,
      last_review:    null,
    },
  ]
}
