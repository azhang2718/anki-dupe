import type { User, Word, Card, Review, Achievement, Document, Statistic, EnrichedWord, ReadinessResult } from './db'

declare global {
  interface Window {
    claudeAPI: {
      testKey(): Promise<{ ok: boolean; data?: boolean; error?: string }>
      extractFromDocument(docId: number): Promise<{ ok: boolean; data?: { wordsAdded: number; words: Word[] }; error?: string }>
      extractFromText(text: string): Promise<{ ok: boolean; data?: Word[]; error?: string }>
    }
    importAPI: {
      openDialog(type: 'files' | 'folder'): Promise<{ ok: boolean; data?: Document[]; error?: string }>
      importPaths(paths: string[]): Promise<{ ok: boolean; data?: Document[]; error?: string }>
      processDocument(docId: number): Promise<{ ok: boolean; data?: Document; error?: string }>
      processAll(): Promise<{ ok: boolean; data?: { id: number; ok: boolean; error?: string }[] }>
      onProgress(cb: (data: { docId: number; pct: number; status: string }) => void): () => void
    }
    electronAPI: {
      platform: string
      widget: {
        toggle(): Promise<boolean>
        setAlwaysOnTop(value: boolean): Promise<void>
        setExpanded(value: boolean): Promise<void>
        isOpen(): Promise<boolean>
      }
      window: {
        minimize(): Promise<void>
        maximize(): Promise<void>
        close(): Promise<void>
      }
      system: {
        log(msg: string, level: string): Promise<void>
        getLogs(): Promise<{ ok: boolean; data: string }>
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
        delete(id: number): Promise<void>
        upsert(word: Omit<Word, 'id' | 'created_at'>): Promise<Word>
        upsertWithCards(word: Omit<Word, 'id' | 'created_at'>): Promise<Word>
        count(): Promise<number>
        countLearned(): Promise<number>
        getTopByImportance(limit?: number): Promise<Word[]>
        getEnriched(): Promise<EnrichedWord[]>
        recalculateImportance(): Promise<{ updated: number }>
        getGraphData(): Promise<{
          words: Array<{ id: number; chinese: string; pinyin: string; meaning: string; difficulty: number; importance_score: number; source_document_id: number | null; best_state: string }>
          docs: Array<{ id: number; title: string }>
          edges: Array<{ source: string; target: string; type: 'doc' | 'char' }>
        }>
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
        analyzeReadiness(docId: number): Promise<ReadinessResult>
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
      backup: {
        exportFull(): Promise<any>
        importFull(data: any): Promise<{ ok: boolean }>
      }
    }
  }
}

export {}
