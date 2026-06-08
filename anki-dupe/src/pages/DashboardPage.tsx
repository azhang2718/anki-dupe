import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import StatCard from '../components/ui/StatCard'
import XpBar from '../components/ui/XpBar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { SkeletonCard } from '../components/ui/SkeletonLoader'
import type { User } from '../types/db'

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

const levelTitles: Record<number, string> = {
  1: 'Beginner Reader', 5: 'Curious Reader', 10: 'Casual Reader',
  25: 'Web Reader', 50: 'Novel Reader', 100: 'Character Sage',
}

function getLevelTitle(level: number): string {
  const thresholds = Object.keys(levelTitles).map(Number).sort((a, b) => b - a)
  return levelTitles[thresholds.find((t) => level >= t) ?? 1]
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [wordCount, setWordCount] = useState(0)
  const [dueCount, setDueCount] = useState(0)
  const [accuracy, setAccuracy] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      window.db.user.get(),
      window.db.words.count(),
      window.db.cards.countDue(),
      window.db.reviews.getAccuracy7d(),
    ]).then(([u, wc, dc, acc]) => {
      setUser(u)
      setWordCount(wc)
      setDueCount(dc)
      setAccuracy(acc)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-48 bg-surface-medium rounded-md animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="flex flex-col gap-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-700">
            {getGreeting()} ☀️
          </h1>
          <p className="text-slate-400 mt-0.5 text-sm">
            {user ? getLevelTitle(user.level) : 'Your reading journey continues.'}
          </p>
        </div>
        {dueCount > 0 && (
          <Button onClick={() => navigate('/review')} variant="primary">
            Study {dueCount} due cards →
          </Button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Words Learned" value={wordCount} icon="📖" color="blue" />
        <StatCard
          label="Day Streak"
          value={user ? `${user.streak_days} 🔥` : '0'}
          icon="🔥"
          color="gold"
          subtext={user?.streak_days ? 'Keep it up!' : 'Start studying to build your streak'}
        />
        <StatCard
          label="7-Day Accuracy"
          value={accuracy ? `${accuracy}%` : '—'}
          icon="✨"
          color="mint"
          subtext="Review accuracy"
        />
      </div>

      {/* XP progress */}
      {user && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-600">Your Progress</span>
            <span className="text-xs text-slate-400">{user.total_xp.toLocaleString()} total XP</span>
          </div>
          <XpBar totalXp={user.total_xp} level={user.level} />
        </Card>
      )}

      {/* Empty state or quick actions */}
      {wordCount === 0 ? (
        <Card>
          <EmptyState
            icon="📖"
            title="No words yet."
            description="Import your first screenshot to begin your journey."
            actionLabel="Import Content"
            onAction={() => navigate('/import')}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <Card onClick={() => navigate('/review')} className="hover:scale-[1.01] transition-transform">
            <p className="text-2xl mb-2">🃏</p>
            <p className="font-semibold text-slate-700 text-sm">Review Cards</p>
            <p className="text-slate-400 text-xs mt-0.5">{dueCount} cards due now</p>
          </Card>
          <Card onClick={() => navigate('/import')} className="hover:scale-[1.01] transition-transform">
            <p className="text-2xl mb-2">📥</p>
            <p className="font-semibold text-slate-700 text-sm">Import Content</p>
            <p className="text-slate-400 text-xs mt-0.5">Add screenshots, PDFs, text</p>
          </Card>
        </div>
      )}
    </motion.div>
  )
}
