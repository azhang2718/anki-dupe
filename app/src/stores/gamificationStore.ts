// Gamification store — reduced to no-op after XP/achievement removal.
// Kept as a stub so any lingering imports don't hard-error during the transition.
import { create } from 'zustand'

interface GamificationStore {
  // intentionally empty
}

export const useGamificationStore = create<GamificationStore>(() => ({}))
