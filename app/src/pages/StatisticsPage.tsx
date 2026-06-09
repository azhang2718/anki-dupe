import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import Card from '../components/ui/Card'
import { SkeletonCard } from '../components/ui/SkeletonLoader'
import type { Statistic, User } from '../types/db'

interface CardStateCounts {
  new: number
  learning: number
  review: number
  mastered: number
}

interface Totals {
  totalReviewed: number
  totalCorrect: number
  totalXp: number
  totalTimeMs: number
}

// Fill in missing dates with zero values so the chart has a continuous axis
function fillDates(rows: Statistic[]): Array<{ date: string; xp: number; accuracy: number; reviewed: number }> {
  const map = new Map(rows.map((r) => [r.date, r]))
  const result = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const row = map.get(key)
    const reviewed = row?.words_reviewed ?? 0
    const correct = row?.words_correct ?? 0
    result.push({
      date: key,
      xp: row?.xp_earned ?? 0,
      reviewed,
      accuracy: reviewed > 0 ? Math.round((correct / reviewed) * 100) : 0,
    })
  }
  return result
}

// Aggregate daily data into weeks
function toWeekly(daily: ReturnType<typeof fillDates>) {
  const weeks: Array<{ week: string; xp: number; reviewed: number }> = []
  for (let i = 0; i < daily.length; i += 7) {
    const chunk = daily.slice(i, i + 7)
    const label = `Week ${Math.floor(i / 7) + 1}`
    weeks.push({
      week: label,
      xp: chunk.reduce((s, d) => s + d.xp, 0),
      reviewed: chunk.reduce((s, d) => s + d.reviewed, 0),
    })
  }
  return weeks
}

const STATE_COLORS = {
  new: '#A9D6FF',
  learning: '#FFD866',
  review: '#7CB9FF',
  mastered: '#95F0C0',
}
const STATE_LABELS = { new: 'New', learning: 'Learning', review: 'Review', mastered: 'Mastered' }

function msToHours(ms: number): string {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function StatBigCard({ label, value, sub, icon }: { label: string; value: string | number; sub?: string; icon: string }) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-2xl">{icon}</span>
      <p className="text-2xl font-bold text-slate-700 mt-1">{value}</p>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </Card>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">{children}</h2>
  )
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/95 shadow-modal rounded-lg px-3 py-2 text-xs border border-surface-medium">
      <p className="font-semibold text-slate-600 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-slate-500">{p.name}: <span className="font-semibold text-slate-700">{p.value}</span></p>
      ))}
    </div>
  )
}

export default function StatisticsPage() {
  const [daily, setDaily] = useState<ReturnType<typeof fillDates>>([])
  const [cardStates, setCardStates] = useState<CardStateCounts>({ new: 0, learning: 0, review: 0, mastered: 0 })
  const [totals, setTotals] = useState<Totals | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [wordCount, setWordCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      window.db.stats.getLast30Days(),
      window.db.stats.getTotals(),
      window.db.cards.countByState(),
      window.db.user.get(),
      window.db.words.countLearned(),
    ]).then(([rows, t, states, u, lc]) => {
      setDaily(fillDates(rows as Statistic[]))
      setTotals(t as Totals)
      setCardStates(states as CardStateCounts)
      setUser(u as User)
      setWordCount(lc as number)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-40 bg-surface-medium rounded-md animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
        <SkeletonCard />
      </div>
    )
  }

  const weekly = toWeekly(daily)
  const accuracy = totals && totals.totalReviewed > 0
    ? Math.round((totals.totalCorrect / totals.totalReviewed) * 100)
    : 0
  const totalCards = cardStates.new + cardStates.learning + cardStates.review + cardStates.mastered
  const pieData = (Object.keys(STATE_COLORS) as (keyof CardStateCounts)[])
    .filter((k) => cardStates[k] > 0)
    .map((k) => ({ name: STATE_LABELS[k], value: cardStates[k], key: k }))

  const recentActiveDays = daily.filter((d) => d.reviewed > 0).length

  return (
    <motion.div
      className="flex flex-col gap-8"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-700">Your Progress</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {recentActiveDays > 0
            ? `Active ${recentActiveDays} of the last 30 days`
            : 'Start studying to see your stats grow'}
        </p>
      </div>

      {/* Big numbers */}
      <section>
        <SectionHeader>All Time</SectionHeader>
        <div className="grid grid-cols-4 gap-4">
          <StatBigCard icon="📖" label="Words Learned" value={wordCount.toLocaleString()} />
          <StatBigCard icon="🌟" label="Total XP" value={(totals?.totalXp ?? 0).toLocaleString()} />
          <StatBigCard
            icon="🎯"
            label="Accuracy"
            value={accuracy ? `${accuracy}%` : '—'}
            sub={totals?.totalReviewed ? `from ${totals.totalReviewed.toLocaleString()} reviews` : 'No reviews yet'}
          />
          <StatBigCard
            icon="⏱️"
            label="Study Time"
            value={totals?.totalTimeMs ? msToHours(totals.totalTimeMs) : '—'}
            sub={user ? `${user.streak_days} day streak 🔥` : undefined}
          />
        </div>
      </section>

      {/* Daily XP area chart */}
      <section>
        <SectionHeader>Daily XP — Last 30 Days</SectionHeader>
        <Card>
          {daily.every((d) => d.xp === 0) ? (
            <EmptyChart message="Study to start earning XP" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={daily} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7CB9FF" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#7CB9FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF4FA" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => {
                    const d = new Date(v + 'T00:00:00')
                    return `${d.getMonth() + 1}/${d.getDate()}`
                  }}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  interval={6}
                />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="xp"
                  name="XP"
                  stroke="#7CB9FF"
                  strokeWidth={2}
                  fill="url(#xpGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#7CB9FF' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>
      </section>

      {/* Weekly reviews + accuracy row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Weekly reviews bar chart */}
        <section>
          <SectionHeader>Weekly Reviews</SectionHeader>
          <Card>
            {weekly.every((w) => w.reviewed === 0) ? (
              <EmptyChart message="No reviews yet" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weekly} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF4FA" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="reviewed" name="Reviews" fill="#A9D6FF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </section>

        {/* Daily accuracy area chart */}
        <section>
          <SectionHeader>Daily Accuracy %</SectionHeader>
          <Card>
            {daily.every((d) => d.accuracy === 0) ? (
              <EmptyChart message="Review some cards to see accuracy" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={daily} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#95F0C0" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#95F0C0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF4FA" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v: string) => {
                      const d = new Date(v + 'T00:00:00')
                      return `${d.getMonth() + 1}/${d.getDate()}`
                    }}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    interval={6}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="accuracy"
                    name="Accuracy %"
                    stroke="#95F0C0"
                    strokeWidth={2}
                    fill="url(#accGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#95F0C0' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>
        </section>
      </div>

      {/* Card state distribution */}
      <section>
        <SectionHeader>Card Mastery</SectionHeader>
        <Card>
          <div className="flex items-center gap-8">
            {totalCards === 0 ? (
              <div className="flex-1 flex items-center justify-center py-8">
                <EmptyChart message="Import content to see your card distribution" />
              </div>
            ) : (
              <>
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.key} fill={STATE_COLORS[entry.key as keyof typeof STATE_COLORS]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [`${value} cards`, name]}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #EEF4FA' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-3 flex-1">
                  {(Object.keys(STATE_COLORS) as (keyof CardStateCounts)[]).map((key) => {
                    const count = cardStates[key]
                    const pct = totalCards > 0 ? Math.round((count / totalCards) * 100) : 0
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-600 font-medium">{STATE_LABELS[key]}</span>
                          <span className="text-slate-400">{count} cards · {pct}%</span>
                        </div>
                        <div className="h-1.5 bg-surface-medium rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: STATE_COLORS[key] }}
                          />
                        </div>
                      </div>
                    )
                  })}
                  <p className="text-xs text-slate-400 pt-1">
                    {cardStates.mastered} of {totalCards} cards mastered
                    {totalCards > 0 && ` (${Math.round((cardStates.mastered / totalCards) * 100)}%)`}
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>
      </section>
    </motion.div>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-[160px]">
      <p className="text-slate-300 text-sm">{message}</p>
    </div>
  )
}
