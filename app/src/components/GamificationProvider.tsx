import { useEffect, useRef } from 'react'
import { useGamificationStore } from '../stores/gamificationStore'
import AchievementToast from './ui/AchievementToast'
import LevelUpOverlay from './ui/LevelUpOverlay'

/**
 * Mounts globally inside Layout.
 * - Shows AchievementToast queue
 * - Shows LevelUpOverlay
 * - Polls streak update on mount
 */
export default function GamificationProvider() {
  const store = useGamificationStore()
  const prevLevel = useRef<number | null>(null)

  // Update streak on app load and check for level changes
  useEffect(() => {
    async function init() {
      const user = await window.db.user.updateStreak()
      prevLevel.current = user.level

      // Check achievements on launch (streak milestones, etc.)
      const newAchievements = await window.db.achievements.check({
        streakDays: user.streak_days,
      })
      store.enqueueAchievements(newAchievements)
    }
    init()
  }, [])

  return (
    <>
      <AchievementToast
        achievement={store.currentToast}
        onDismiss={store.dismissToast}
      />
      <LevelUpOverlay
        level={store.levelUpLevel}
        onDismiss={store.dismissLevelUp}
      />
    </>
  )
}
