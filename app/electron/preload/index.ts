import { contextBridge, ipcRenderer } from 'electron'

type IpcResult<T> = { ok: true; data: T } | { ok: false; error: string }

async function invoke<T>(channel: string, ...args: unknown[]): Promise<T> {
  const result: IpcResult<T> = await ipcRenderer.invoke(channel, ...args)
  if (!result.ok) throw new Error(result.error)
  return result.data
}

contextBridge.exposeInMainWorld('db', {
  user: {
    get: () => invoke('db:user:get'),
    addXp: (amount: number, reason: string) => invoke('db:user:addXp', amount, reason),
    updateStreak: () => invoke('db:user:updateStreak'),
    deductXp: (amount: number, reason: string) => invoke('db:user:deductXp', amount, reason),
    updateDailyGoal: (goal: number) => invoke('db:user:updateDailyGoal', goal),
  },
  words: {
    getAll: () => invoke('db:words:getAll'),
    getById: (id: number) => invoke('db:words:getById', id),
    delete: (id: number) => invoke('db:words:delete', id),
    upsert: (word: unknown) => invoke('db:words:upsert', word),
    upsertWithCards: (word: unknown) => invoke('db:words:upsertWithCards', word),
    count: () => invoke('db:words:count'),
    countLearned: () => invoke('db:words:countLearned'),
    getTopByImportance: (limit?: number) => invoke('db:words:getTopByImportance', limit),
    getEnriched: () => invoke('db:words:getEnriched'),
    recalculateImportance: () => invoke('db:words:recalculateImportance'),
    getGraphData: () => invoke('db:words:getGraphData'),
    getByChinese: (chinese: string) => invoke('db:words:getByChinese', chinese),
    deleteMany: (ids: number[]) => invoke('db:words:deleteMany', ids),
    findInvalidScript: () => invoke<number[]>('db:words:findInvalidScript'),
  },
  cards: {
    getDue: (limit?: number) => invoke('db:cards:getDue', limit),
    getById: (id: number) => invoke('db:cards:getById', id),
    getByWordId: (wordId: number) => invoke('db:cards:getByWordId', wordId),
    create: (card: unknown) => invoke('db:cards:create', card),
    update: (id: number, updates: unknown) => invoke('db:cards:update', id, updates),
    countDue: () => invoke('db:cards:countDue'),
    countByState: () => invoke('db:cards:countByState'),
    getMastered: (limit?: number) => invoke('db:cards:getMastered', limit),
  },
  reviews: {
    create: (review: unknown, isMastered?: boolean) => invoke('db:reviews:create', review, isMastered),
    getRecent: (limit?: number) => invoke('db:reviews:getRecent', limit),
    getAccuracy7d: () => invoke('db:reviews:getAccuracy7d'),
  },
  achievements: {
    getAll: () => invoke('db:achievements:getAll'),
    getUnlocked: () => invoke('db:achievements:getUnlocked'),
    unlock: (key: string) => invoke('db:achievements:unlock', key),
    check: (ctx?: Record<string, unknown>) => invoke('db:achievements:check', ctx ?? {}),
  },
  documents: {
    getAll: () => invoke('db:documents:getAll'),
    delete: (id: number) => invoke('db:documents:delete', id),
    getById: (id: number) => invoke('db:documents:getById', id),
    create: (doc: unknown) => invoke('db:documents:create', doc),
    updateStatus: (id: number, status: string, rawText?: string) =>
      invoke('db:documents:updateStatus', id, status, rawText),
    analyzeReadiness: (docId: number) => invoke('db:documents:analyzeReadiness', docId),
  },
  settings: {
    get: (key: string) => invoke('db:settings:get', key),
    set: (key: string, value: string) => invoke('db:settings:set', key, value),
    getAll: () => invoke('db:settings:getAll'),
  },
  stats: {
    getToday: () => invoke('db:stats:getToday'),
    getLast30Days: () => invoke('db:stats:getLast30Days'),
    getTotals: () => invoke('db:stats:getTotals'),
    getWordLearningHistory: () => invoke('db:stats:getWordLearningHistory'),
    getAllLanguagesHistory: () => invoke('db:stats:getAllLanguagesHistory'),
  },
  backup: {
    exportFull: () => invoke('db:exportFull'),
    importFull: (data: unknown) => invoke('db:importFull', data),
  },
  language: {
    get: () => invoke<string>('db:language:get'),
    set: (lang: string) => invoke('db:language:set', lang),
  },
})

contextBridge.exposeInMainWorld('claudeAPI', {
  testKey: () => ipcRenderer.invoke('claude:testKey'),
  extractFromDocument: (docId: number) => ipcRenderer.invoke('claude:extractFromDocument', docId),
  extractFromText: (text: string) => ipcRenderer.invoke('claude:extractFromText', text),
  identifyCharacter: (imageDataUrl: string) => ipcRenderer.invoke('claude:identifyCharacter', imageDataUrl),
})

contextBridge.exposeInMainWorld('importAPI', {
  openDialog: (type: 'files' | 'folder') => ipcRenderer.invoke('import:dialog', type),
  importPaths: (paths: string[]) => ipcRenderer.invoke('import:files', paths),
  processDocument: (docId: number) => ipcRenderer.invoke('ocr:processDocument', docId),
  processAll: () => ipcRenderer.invoke('ocr:processAll'),
  identifyDrawing: (imageDataUrl: string) => ipcRenderer.invoke('ocr:identifyDrawing', imageDataUrl),
  onProgress: (cb: (data: { docId: number; pct: number; status: string }) => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: { docId: number; pct: number; status: string }) => cb(data)
    ipcRenderer.on('ocr:progress', handler)
    return () => ipcRenderer.removeListener('ocr:progress', handler)
  },
})

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  widget: {
    toggle:         () => ipcRenderer.invoke('widget:toggle'),
    setAlwaysOnTop: (v: boolean) => ipcRenderer.invoke('widget:setAlwaysOnTop', v),
    setExpanded:    (v: boolean) => ipcRenderer.invoke('widget:setExpanded', v),
    isOpen:         () => ipcRenderer.invoke('widget:isOpen'),
  },
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close:    () => ipcRenderer.invoke('window:close'),
  },
  system: {
    log:     (msg: string, level: string) => ipcRenderer.invoke('system:log', msg, level),
    getLogs: () => ipcRenderer.invoke('system:getLogs'),
  },
})
