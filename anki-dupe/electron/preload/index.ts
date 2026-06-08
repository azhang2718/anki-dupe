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
    updateDailyGoal: (goal: number) => invoke('db:user:updateDailyGoal', goal),
  },
  words: {
    getAll: () => invoke('db:words:getAll'),
    getById: (id: number) => invoke('db:words:getById', id),
    upsert: (word: unknown) => invoke('db:words:upsert', word),
    upsertWithCards: (word: unknown) => invoke('db:words:upsertWithCards', word),
    count: () => invoke('db:words:count'),
    getTopByImportance: (limit?: number) => invoke('db:words:getTopByImportance', limit),
  },
  cards: {
    getDue: (limit?: number) => invoke('db:cards:getDue', limit),
    getById: (id: number) => invoke('db:cards:getById', id),
    getByWordId: (wordId: number) => invoke('db:cards:getByWordId', wordId),
    create: (card: unknown) => invoke('db:cards:create', card),
    update: (id: number, updates: unknown) => invoke('db:cards:update', id, updates),
    countDue: () => invoke('db:cards:countDue'),
    countByState: () => invoke('db:cards:countByState'),
  },
  reviews: {
    create: (review: unknown) => invoke('db:reviews:create', review),
    getRecent: (limit?: number) => invoke('db:reviews:getRecent', limit),
    getAccuracy7d: () => invoke('db:reviews:getAccuracy7d'),
  },
  achievements: {
    getAll: () => invoke('db:achievements:getAll'),
    getUnlocked: () => invoke('db:achievements:getUnlocked'),
    unlock: (key: string) => invoke('db:achievements:unlock', key),
  },
  documents: {
    getAll: () => invoke('db:documents:getAll'),
    getById: (id: number) => invoke('db:documents:getById', id),
    create: (doc: unknown) => invoke('db:documents:create', doc),
    updateStatus: (id: number, status: string, rawText?: string) =>
      invoke('db:documents:updateStatus', id, status, rawText),
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
  },
})

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  widget: {
    toggle:       () => ipcRenderer.invoke('widget:toggle'),
    setAlwaysOnTop: (v: boolean) => ipcRenderer.invoke('widget:setAlwaysOnTop', v),
    setExpanded:  (v: boolean) => ipcRenderer.invoke('widget:setExpanded', v),
    isOpen:       () => ipcRenderer.invoke('widget:isOpen'),
  },
})
