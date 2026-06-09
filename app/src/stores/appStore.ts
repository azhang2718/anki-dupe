import { create } from 'zustand'

interface AppState {
  isOnline: boolean
  setOnline: (online: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  isOnline: navigator.onLine,
  setOnline: (online) => set({ isOnline: online }),
}))
