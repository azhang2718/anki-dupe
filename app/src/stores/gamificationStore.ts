import { create } from 'zustand'
import type { Achievement } from '../types/db'

interface GamificationStore {
  toastQueue: Achievement[]
  currentToast: Achievement | null
  levelUpLevel: number | null

  enqueueAchievements: (achievements: Achievement[]) => void
  dismissToast: () => void
  showLevelUp: (level: number) => void
  dismissLevelUp: () => void
}

export const useGamificationStore = create<GamificationStore>((set, get) => ({
  toastQueue: [],
  currentToast: null,
  levelUpLevel: null,

  enqueueAchievements(achievements) {
    if (achievements.length === 0) return
    set((s) => {
      const queue = [...s.toastQueue, ...achievements]
      // If nothing showing, pop the first one immediately
      if (!s.currentToast) {
        return { toastQueue: queue.slice(1), currentToast: queue[0] }
      }
      return { toastQueue: queue }
    })
  },

  dismissToast() {
    const { toastQueue } = get()
    const next = toastQueue[0] ?? null
    set({ currentToast: next, toastQueue: toastQueue.slice(1) })
  },

  showLevelUp(level) {
    set({ levelUpLevel: level })
  },

  dismissLevelUp() {
    set({ levelUpLevel: null })
  },
}))
