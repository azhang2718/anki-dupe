import type { User, Word, Card, Review, Achievement, Document, Statistic } from './db'

declare global {
  interface Window {
    electronAPI: {
      platform: string
      widget: {
        toggle(): Promise<boolean>
        setAlwaysOnTop(value: boolean): Promise<void>
        setExpanded(value: boolean): Promise<void>
        isOpen(): Promise<boolean>
      }
    }
    db: {
      user: {
        get(): Promise<User>
        addXp(amount: number, reason: string): Promise<User>
        updateStreak(): Promise<User>
        updateDailyGoal(goal: number): Promise<void>
      }
      words: {
        getAll(): Promise<Word[]>
        getById(id: number): Promise<Word | null>
        upsert(word: Omit<Word, 'id' | 'created_at'>): Promise<Word>
        upsertWithCards(word: Omit<Word, 'id' | 'created_at'>): Promise<Word>
        count(): Promise<number>
        getTopByImportance(limit?: number): Promise<Word[]>
      }
      cards: {
        getDue(limit?: number): Promise<Card[]>
        getById(id: number): Promise<Card | null>
        getByWordId(wordId: number): Promise<Card[]>
        create(card: Omit<Card, 'id' | 'created_at'>): Promise<Card>
        update(id: number, updates: Partial<Card>): Promise<Card>
        countDue(): Promise<number>
        countByState(): Promise<Record<Card['state'], number>>
      }
      reviews: {
        create(review: Omit<Review, 'id' | 'reviewed_at'>): Promise<Review>
        getRecent(limit?: number): Promise<Review[]>
        getAccuracy7d(): Promise<number>
      }
      achievements: {
        getAll(): Promise<Achievement[]>
        getUnlocked(): Promise<Achievement[]>
        unlock(key: string): Promise<Achievement | null>
        check(ctx?: { wordCount?: number; masteredCount?: number; streakDays?: number; documentCount?: number; sessionPerfect?: boolean }): Promise<Achievement[]>
      }
      documents: {
        getAll(): Promise<Document[]>
        getById(id: number): Promise<Document | null>
        create(doc: Omit<Document, 'id' | 'created_at'>): Promise<Document>
        updateStatus(id: number, status: Document['processing_status'], rawText?: string): Promise<void>
      }
      settings: {
        get(key: string): Promise<string>
        set(key: string, value: string): Promise<void>
        getAll(): Promise<Record<string, string>>
      }
      stats: {
        getToday(): Promise<Statistic | null>
        getLast30Days(): Promise<Statistic[]>
        getTotals(): Promise<{ totalReviewed: number; totalCorrect: number; totalXp: number; totalTimeMs: number }>
      }
    }
  }
}

export {}
