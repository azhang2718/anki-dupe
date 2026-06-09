import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import Card from '../components/ui/Card'
import { SkeletonCard } from '../components/ui/SkeletonLoader'
import type { Statistic } from '../types/db'
import { LANGUAGE_CONFIGS, LANGUAGE_CODES, type LanguageCode } from '../types/languages'

interface CardStateCounts { new: number; learning: number; review: number; mastered: number }
interface Totals { totalReviewed: number; totalCorrect: number; totalXp: number; totalTimeMs: number }
interface WordHistoryForLang { newPerDay: { date: string; count: number }[]; masteredPerDay: { date: string; count: number }[] }
type AllLanguagesHistory = Record<string, WordHistoryForLang>

const STATE_COLORS = { new: '#A9D6FF', learning: '#FFD866', review: '#7CB9FF', mastered: '#95F0C0' }
const STATE_LABELS = { new: 'New', learning: 'Learning', review: 'Review', mastered: 'Mastered' }

// ─── Fill last 30 days ────────────────────────────────────────────────────────

function fill30Days(
  newMap: Map<string, number>,
  masteredMap: Map<string, number>
): Array<{ date: string; label: string; newWords: number; mastered: number }> {
  const result = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const label = `${d.getMonth() + 1}/${d.getDate()}`
    result.push({ date: key, label, newWords: newMap.get(key) ?? 0, mastered: masteredMap.get(key) ?? 0 })
  }
  return result
}

/** Build a per-language 30-day series from AllLanguagesHistory */
function buildMultiLangData(all: AllLanguagesHistory): Array<Record<string, unknown>> {
  const result: Array<Record<string, unknown>> = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const label = `${d.getMonth() + 1}/${d.getDate()}`
    const row: Record<string, unknown> = { date: key, label }
    for (const lang of LANGUAGE_CODES) {
      const h = all[lang]
      const newMap = new Map((h?.newPerDay ?? []).map((r) => [r.date, r.count]))
      const mastMap = new Map((h?.masteredPerDay ?? []).map((r) => [r.date, r.count]))
      row[`${lang}_new`] = newMap.get(key) ?? 0
      row[`${lang}_mastered`] = mastMap.get(key) ?? 0
    }
    result.push(row)
  }
  return result
}

// ─── Daily stats for the bar chart ───────────────────────────────────────────

function fillDates(rows: Statistic[]): Array<{ date: string; reviewed: number; accuracy: number; learning: number; mastered: number }> {
  const map = new Map(rows.map((r) => [r.date, r]))
  const result = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const row = map.get(key)
    const reviewed = row?.words_reviewed ?? 0
    const correct = row?.words_correct ?? 0
    const mastered = row?.mastered_reviewed ?? 0
    result.push({
      date: key, reviewed, mastered,
      learning: Math.max(0, reviewed - mastered),
      accuracy: reviewed > 0 ? Math.round((correct / reviewed) * 100) : 0,
    })
  }
  return result
}

function toWeekly(daily: ReturnType<typeof fillDates>) {
  return Array.from({ length: Math.ceil(daily.length / 7) }, (_, i) => {
    const chunk = daily.slice(i * 7, (i + 1) * 7)
    return {
      week: `Week ${i + 1}`,
      learning: chunk.reduce((s, d) => s + d.learning, 0),
      mastered: chunk.reduce((s, d) => s + d.mastered, 0),
    }
  })
}

// ─── Small components ─────────────────────────────────────────────────────────

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
  return <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">{children}</h2>
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/95 shadow-modal rounded-lg px-3 py-2 text-xs border border-surface-medium">
      <p className="font-semibold text-slate-600 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <span className="font-semibold">{p.value}</span></p>
      ))}
    </div>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-[160px]">
      <p className="text-slate-300 text-sm">{message}</p>
    </div>
  )
}

function LineToggle({ color, label, active, onClick }: { color: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`no-drag flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
        active ? 'border-transparent' : 'border-surface-medium bg-white text-slate-400'
      }`}
      style={active ? { background: color + '22', color, borderColor: color + '55' } : {}}
    >
      <div className="w-2 h-2 rounded-full" style={{ background: active ? color : '#cbd5e1' }} />
      {label}
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StatisticsPage() {
  const [daily, setDaily] = useState<ReturnType<typeof fillDates>>([])
  const [wordChartData, setWordChartData] = useState<ReturnType<typeof fill30Days>>([])
  const [multiLangData, setMultiLangData] = useState<Array<Record<string, unknown>>>([])
  const [cardStates, setCardStates] = useState<CardStateCounts>({ new: 0, learning: 0, review: 0, mastered: 0 })
  const [totals, setTotals] = useState<Totals | null>(null)
  const [activeLang, setActiveLang] = useState<LanguageCode>('chinese')
  const [loading, setLoading] = useState(true)
  const [showNewLine, setShowNewLine] = useState(true)
  const [showMasteredLine, setShowMasteredLine] = useState(true)

  // Per-language line toggles — keyed by `{lang}_new` and `{lang}_mastered`
  const [activeLangLines, setActiveLangLines] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    for (const lang of LANGUAGE_CODES) {
      init[`${lang}_new`] = true
      init[`${lang}_mastered`] = true
    }
    return init
  })
  const [showMultiLang, setShowMultiLang] = useState(false)

  useEffect(() => {
    Promise.all([
      window.db.stats.getLast30Days(),
      window.db.stats.getTotals(),
      window.db.cards.countByState(),
      (window.db.stats as any).getWordLearningHistory(),
      (window.db.stats as any).getAllLanguagesHistory(),
      window.db.language.get(),
    ]).then(([rows, t, states, history, allHistory, lang]) => {
      setDaily(fillDates(rows as Statistic[]))
      setTotals(t as Totals)
      setCardStates(states as CardStateCounts)
      setActiveLang((lang ?? 'chinese') as LanguageCode)

      const h = history as { newPerDay: { date: string; count: number }[]; masteredPerDay: { date: string; count: number }[] }
      const newMap = new Map(h.newPerDay.map((r) => [r.date, r.count]))
      const masteredMap = new Map(h.masteredPerDay.map((r) => [r.date, r.count]))
      setWordChartData(fill30Days(newMap, masteredMap))
      setMultiLangData(buildMultiLangData(allHistory as AllLanguagesHistory))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-40 bg-surface-medium rounded-md animate-pulse" />
        <div className="grid grid-cols-3 gap-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
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

  const wordChartHasData = wordChartData.some((d) => d.newWords > 0 || d.mastered > 0)
  const multiLangHasData = multiLangData.some((d) =>
    LANGUAGE_CODES.some((l) => (d[`${l}_new`] as number) > 0 || (d[`${l}_mastered`] as number) > 0)
  )

  return (
    <motion.div className="flex flex-col gap-8" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-700">Your Progress</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {daily.filter((d) => d.reviewed > 0).length > 0
            ? `Active ${daily.filter((d) => d.reviewed > 0).length} of the last 30 days`
            : 'Start studying to see your stats grow'}
        </p>
      </div>

      {/* Big numbers */}
      <section>
        <SectionHeader>All Time — {LANGUAGE_CONFIGS[activeLang].name}</SectionHeader>
        <div className="grid grid-cols-3 gap-4">
          <StatBigCard icon="📖" label="Words Learned" value={(totals?.totalReviewed ?? 0) > 0 ? cardStates.mastered + cardStates.review + cardStates.learning : 0} sub={`${cardStates.mastered} mastered`} />
          <StatBigCard
            icon="🎯"
            label="Accuracy"
            value={accuracy ? `${accuracy}%` : '—'}
            sub={totals?.totalReviewed ? `${totals.totalReviewed.toLocaleString()} total reviews` : 'No reviews yet'}
          />
          <StatBigCard
            icon="🃏"
            label="Flashcards Reviewed"
            value={(totals?.totalReviewed ?? 0).toLocaleString()}
            sub="total cards clicked through"
          />
        </div>
      </section>

      {/* Words Learned — Last 30 Days (active language, toggleable lines) */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <SectionHeader>Words Learned — Last 30 Days</SectionHeader>
            <button
              onClick={() => setShowMultiLang((v) => !v)}
              className={`no-drag -mt-3 text-[10px] px-2 py-0.5 rounded-full border font-medium transition-all ${
                showMultiLang
                  ? 'bg-slate-700 text-white border-slate-700'
                  : 'text-slate-400 border-surface-medium bg-white hover:bg-surface-light'
              }`}
            >
              {showMultiLang ? 'All Languages' : 'Active Only'}
            </button>
          </div>
          {!showMultiLang && (
            <div className="flex items-center gap-2 mb-3">
              <LineToggle color="#7CB9FF" label="New words" active={showNewLine} onClick={() => setShowNewLine((v) => !v)} />
              <LineToggle color="#95F0C0" label="Mastered" active={showMasteredLine} onClick={() => setShowMasteredLine((v) => !v)} />
            </div>
          )}
        </div>

        <Card>
          {showMultiLang ? (
            // ── Multi-language view ──
            <>
              {!multiLangHasData ? (
                <EmptyChart message="No multi-language data yet — study in multiple languages to compare" />
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {LANGUAGE_CODES.flatMap((lang) => {
                      const cfg = LANGUAGE_CONFIGS[lang]
                      return [
                        { key: `${lang}_new`, label: `${cfg.flag} ${cfg.name} New`, color: cfg.color },
                        { key: `${lang}_mastered`, label: `${cfg.flag} ${cfg.name} Mastered`, color: cfg.color + 'AA' },
                      ]
                    }).map(({ key, label, color }) => (
                      <LineToggle
                        key={key}
                        color={color}
                        label={label}
                        active={activeLangLines[key] ?? true}
                        onClick={() => setActiveLangLines((prev) => ({ ...prev, [key]: !prev[key] }))}
                      />
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={multiLangData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EEF4FA" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={6} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      {LANGUAGE_CODES.flatMap((lang) => {
                        const cfg = LANGUAGE_CONFIGS[lang]
                        return [
                          activeLangLines[`${lang}_new`] && (
                            <Line key={`${lang}_new`} type="monotone" dataKey={`${lang}_new`}
                              name={`${cfg.flag} ${cfg.name} New`} stroke={cfg.color}
                              strokeWidth={2} dot={false} activeDot={{ r: 3, fill: cfg.color }} />
                          ),
                          activeLangLines[`${lang}_mastered`] && (
                            <Line key={`${lang}_mastered`} type="monotone" dataKey={`${lang}_mastered`}
                              name={`${cfg.flag} ${cfg.name} Mastered`} stroke={cfg.color + 'AA'}
                              strokeWidth={2} strokeDasharray="4 2" dot={false} activeDot={{ r: 3 }} />
                          ),
                        ].filter(Boolean)
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </>
              )}
            </>
          ) : (
            // ── Single language view ──
            !wordChartHasData ? (
              <EmptyChart message="Study cards to track your learning progress" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={wordChartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF4FA" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={6} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  {showNewLine && (
                    <Line type="monotone" dataKey="newWords" name="New words" stroke="#7CB9FF"
                      strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#7CB9FF' }} />
                  )}
                  {showMasteredLine && (
                    <Line type="monotone" dataKey="mastered" name="Mastered" stroke="#95F0C0"
                      strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#95F0C0' }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            )
          )}
        </Card>
      </section>

      {/* Weekly reviews + accuracy */}
      <div className="grid grid-cols-2 gap-4">
        <section>
          <SectionHeader>Weekly Reviews</SectionHeader>
          <Card>
            {weekly.every((w) => w.learning + w.mastered === 0) ? (
              <EmptyChart message="No reviews yet" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={weekly} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF4FA" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="learning" name="Learning" stackId="a" fill="#A9D6FF" />
                    <Bar dataKey="mastered" name="Mastered" stackId="a" fill="#95F0C0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 mt-2 justify-end">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <div className="w-2.5 h-2.5 rounded-sm bg-[#A9D6FF]" /> Learning
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <div className="w-2.5 h-2.5 rounded-sm bg-[#95F0C0]" /> Mastered
                  </div>
                </div>
              </>
            )}
          </Card>
        </section>

        <section>
          <SectionHeader>Daily Accuracy %</SectionHeader>
          <Card>
            {daily.every((d) => d.accuracy === 0) ? (
              <EmptyChart message="Review some cards to see accuracy" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={daily} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF4FA" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v: string) => { const d = new Date(v + 'T00:00:00'); return `${d.getMonth()+1}/${d.getDate()}` }}
                    tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={6}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="accuracy" name="Accuracy %" stroke="#95F0C0" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#95F0C0' }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </section>
      </div>

      {/* Card Mastery distribution */}
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
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {pieData.map((entry) => (
                        <Cell key={entry.key} fill={STATE_COLORS[entry.key as keyof typeof STATE_COLORS]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [`${value} cards`, name]} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #EEF4FA' }} />
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
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: STATE_COLORS[key] }} />
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
