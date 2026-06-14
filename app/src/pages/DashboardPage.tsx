import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import StatCard from '../components/ui/StatCard'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { SkeletonCard } from '../components/ui/SkeletonLoader'

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [wordCount, setWordCount] = useState(0)
  const [learnedCount, setLearnedCount] = useState(0)
  const [masteredCount, setMasteredCount] = useState(0)
  const [dueCount, setDueCount] = useState(0)
  const [accuracy, setAccuracy] = useState(0)
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      window.db.words.count(),
      window.db.words.countLearned(),
      window.db.cards.countByState(),
      window.db.cards.countDue(),
      window.db.reviews.getAccuracy7d(),
      window.db.user.get(),
    ]).then(([wc, lc, states, dc, acc, user]) => {
      setWordCount(wc as number)
      setLearnedCount(lc as number)
      setMasteredCount((states as Record<string, number>).mastered ?? 0)
      setDueCount(dc as number)
      setAccuracy(acc as number)
      setStreak((user as { streak_days: number }).streak_days)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-48 cosmic-panel rounded-md animate-pulse" />
        <div className="grid grid-cols-3 gap-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      </div>
    )
  }

  return (
    <motion.div
      className="flex flex-col gap-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-200">{getGreeting()} ☀️</h1>
          <p className="text-slate-400 mt-0.5 text-sm">Your reading journey continues.</p>
        </div>
        {dueCount > 0 && (
          <Button onClick={() => navigate('/review')} variant="primary">
            Study {dueCount} due cards →
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Words in Library"
          value={wordCount}
          icon="📖"
          color="blue"
          subtext={learnedCount > 0 ? `${learnedCount} studied` : undefined}
        />
        <StatCard
          label="Mastered"
          value={masteredCount}
          icon="✅"
          color="mint"
          subtext={wordCount > 0 ? `${Math.round((masteredCount / wordCount) * 100)}% of library` : undefined}
        />
        <StatCard
          label="7-Day Accuracy"
          value={accuracy ? `${accuracy}%` : '—'}
          icon="🎯"
          color="gold"
          subtext={streak > 0 ? `${streak} day streak 🔥` : 'Start studying!'}
        />
      </div>

      {/* Quick actions */}
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
          <Card onClick={() => navigate('/review')}>
            <p className="text-2xl mb-2">🃏</p>
            <p className="font-semibold text-slate-200 text-sm">Review Cards</p>
            <p className="text-slate-400 text-xs mt-0.5">{dueCount > 0 ? `${dueCount} cards due now` : 'All caught up!'}</p>
          </Card>
          <Card onClick={() => navigate('/import')}>
            <p className="text-2xl mb-2">📥</p>
            <p className="font-semibold text-slate-200 text-sm">Import Content</p>
            <p className="text-slate-400 text-xs mt-0.5">Add screenshots, PDFs, text</p>
          </Card>
        </div>
      )}
    </motion.div>
  )
}
