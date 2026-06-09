import { useEffect } from 'react'

/**
 * Runs on mount to update the user's study streak.
 * Achievements and XP have been removed.
 */
export default function GamificationProvider() {
  useEffect(() => {
    window.db.user.updateStreak().catch(() => null)
  }, [])

  return null
}
