import { useEffect, useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import EmptyState from '../components/ui/EmptyState'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { SkeletonCard } from '../components/ui/SkeletonLoader'
import type { EnrichedWord } from '../types/db'
import { LANGUAGE_CONFIGS, type LanguageCode, type LanguageConfig } from '../types/languages'

type Filter = 'all' | 'new' | 'learning' | 'review' | 'mastered'
type SortKey = 'importance' | 'difficulty_asc' | 'difficulty_desc' | 'newest' | 'due_soon' | 'struggling'

const filterLabels: Record<Filter, string> = {
  all: 'All', new: 'New', learning: 'Learning', review: 'Review', mastered: 'Mastered',
}

const sortLabels: Record<SortKey, string> = {
  importance:      '⭐ Importance',
  difficulty_asc:  '📗 Easiest first',
  difficulty_desc: '📕 Hardest first',
  newest:          '🕐 Newest',
  due_soon:        '⏰ Due soon',
  struggling:      '💪 Struggling',
}

const stateBadgeColor: Record<string, 'gray' | 'blue' | 'gold' | 'mint' | 'pink'> = {
  new: 'gray', learning: 'blue', review: 'gold', mastered: 'mint',
}

function difficultyDots(d: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={`w-1.5 h-1.5 rounded-full ${i < d ? 'bg-amber-400' : 'bg-surface-dark'}`} />
  ))
}

function accuracyColor(total: number, correct: number): string {
  if (!total) return 'text-slate-300'
  const pct = correct / total
  if (pct >= 0.8) return 'text-emerald-500'
  if (pct >= 0.5) return 'text-amber-500'
  return 'text-rose-400'
}

export default function VocabularyPage() {
  const navigate = useNavigate()
  const [words, setWords] = useState<EnrichedWord[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<SortKey>('importance')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [recalculating, setRecalculating] = useState(false)
  const [selected, setSelected] = useState<EnrichedWord | null>(null)
  const [activeLang, setActiveLang] = useState<LanguageCode>('chinese')
  const [invalidCount, setInvalidCount] = useState<number | null>(null)
  const [cleaningUp, setCleaningUp] = useState(false)

  const load = useCallback(() => {
    window.db.words.getEnriched().then((ws) => {
      setWords(ws)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    window.db.language.get()
      .then((l) => setActiveLang((l ?? 'chinese') as LanguageCode))
      .catch(() => null)
    load()
    // Count invalid-script words for the cleanup badge
    ;(window.db.words as any).findInvalidScript()
      .then((ids: number[]) => setInvalidCount(ids.length))
      .catch(() => null)
  }, [load])

  const recalculate = async () => {
    setRecalculating(true)
    await window.db.words.recalculateImportance()
    await load()
    setRecalculating(false)
  }

  const cleanupInvalidScript = async () => {
    const ids: number[] = await (window.db.words as any).findInvalidScript()
    if (!ids.length) { setInvalidCount(0); return }
    const confirmed = confirm(
      `Remove ${ids.length} word${ids.length !== 1 ? 's' : ''} that don't match ${langConfig.name} script?\n\nThis will delete those words and their flashcards permanently.`
    )
    if (!confirmed) return
    setCleaningUp(true)
    await (window.db.words as any).deleteMany(ids)
    setInvalidCount(0)
    await load()
    setCleaningUp(false)
  }

  const langConfig = LANGUAGE_CONFIGS[activeLang]

  const sorted = useMemo(() => {
    let list = words.filter((w) => {
      if (filter !== 'all' && w.card_state !== filter) return false
      if (search) {
        const q = search.toLowerCase()
        return w.chinese.toLowerCase().includes(q) || w.pinyin.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q)
      }
      return true
    })

    switch (sort) {
      case 'importance':      list = [...list].sort((a, b) => b.importance_score - a.importance_score); break
      case 'difficulty_asc':  list = [...list].sort((a, b) => a.difficulty - b.difficulty); break
      case 'difficulty_desc': list = [...list].sort((a, b) => b.difficulty - a.difficulty); break
      case 'newest':          list = [...list].sort((a, b) => b.id - a.id); break
      case 'due_soon':        list = [...list].sort((a, b) => new Date(a.next_due).getTime() - new Date(b.next_due).getTime()); break
      case 'struggling':
        list = [...list]
          .filter((w) => w.total_reviews >= 3)
          .sort((a, b) => (a.correct_reviews / a.total_reviews) - (b.correct_reviews / b.total_reviews))
        break
    }
    return list
  }, [words, filter, sort, search])

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 w-40 bg-surface-medium rounded-md animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-700">Vocabulary</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {words.length} {langConfig.name} words in your library
          </p>
        </div>
        <div className="flex gap-2">
          {invalidCount !== null && invalidCount > 0 && (
            <Button
              onClick={cleanupInvalidScript}
              variant="ghost"
              size="sm"
              disabled={cleaningUp}
              className="text-rose-400 hover:text-rose-500 hover:bg-rose-50"
            >
              {cleaningUp ? 'Removing…' : `✕ Remove ${invalidCount} non-${langConfig.name}`}
            </Button>
          )}
          <Button
            onClick={recalculate}
            variant="ghost"
            size="sm"
            disabled={recalculating || words.length === 0}
          >
            {recalculating ? 'Recalculating…' : '↻ Recalculate scores'}
          </Button>
        </div>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={`Search by ${langConfig.charLabel.toLowerCase()}, ${langConfig.readingLabel.toLowerCase()}, or meaning…`}
        className="w-full px-4 py-2.5 rounded-md border border-surface-dark bg-white text-slate-700 text-sm outline-none focus:border-ice-blue transition-colors"
      />

      {/* Filter + Sort row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(filterLabels) as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={[
                'no-drag px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                filter === f ? 'bg-ice-blue text-slate-700' : 'bg-surface-medium text-slate-500 hover:bg-silver-blue',
              ].join(' ')}
            >
              {filterLabels[f]}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="no-drag text-xs border border-surface-dark rounded-md px-2 py-1.5 bg-white text-slate-600 outline-none focus:border-ice-blue"
        >
          {(Object.keys(sortLabels) as SortKey[]).map((k) => (
            <option key={k} value={k}>{sortLabels[k]}</option>
          ))}
        </select>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon="📚"
          title={words.length === 0 ? 'No words yet.' : 'No words match your filter.'}
          description={words.length === 0 ? 'Import content and extract vocabulary to start.' : undefined}
          actionLabel={words.length === 0 ? 'Import Content' : undefined}
          onAction={words.length === 0 ? () => navigate('/import') : undefined}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {sorted.map((word) => (
            <motion.div
              key={word.id}
              layout
              onClick={() => setSelected(word)}
              className="bg-white rounded-lg shadow-soft p-4 flex flex-col gap-2 cursor-pointer hover:shadow-float transition-shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-2xl font-bold text-slate-800"
                  style={{ fontFamily: langConfig.fontFamily }}
                >
                  {word.chinese}
                </p>
                <Badge color={stateBadgeColor[word.card_state]}>{word.card_state}</Badge>
              </div>
              <p className="text-slate-400 text-sm">{word.pinyin}</p>
              <p className="text-slate-600 text-sm font-medium leading-snug">{word.meaning}</p>

              <div className="flex items-center justify-between mt-1 pt-2 border-t border-surface-light">
                <div className="flex items-center gap-0.5">
                  {difficultyDots(word.difficulty)}
                </div>
                {word.total_reviews > 0 && (
                  <span className={`text-[11px] font-medium ${accuracyColor(word.total_reviews, word.correct_reviews)}`}>
                    {Math.round((word.correct_reviews / word.total_reviews) * 100)}% acc
                  </span>
                )}
                <span className="text-[11px] text-slate-300">★{word.importance_score}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Word detail modal */}
      <AnimatePresence>
        {selected && (
          <WordDetailModal
            word={selected}
            langConfig={langConfig}
            onClose={() => setSelected(null)}
            onDelete={() => { setSelected(null); load() }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function WordDetailModal({
  word: w,
  langConfig,
  onClose,
  onDelete
}: {
  word: EnrichedWord
  langConfig: LanguageConfig
  onClose: () => void
  onDelete: () => void
}) {
  const accuracy = w.total_reviews > 0 ? Math.round((w.correct_reviews / w.total_reviews) * 100) : null
  const dueDate = new Date(w.next_due)
  const isDue = dueDate <= new Date()

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      {/* Sheet */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-modal p-6 pb-8 max-w-lg mx-auto"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-surface-dark rounded-full mx-auto mb-5" />

        <div className="flex items-start justify-between mb-4">
          <div>
            <p
              className="text-4xl font-bold text-slate-800"
              style={{ fontFamily: langConfig.fontFamily }}
            >
              {w.chinese}
            </p>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-2">
              {langConfig.readingLabel}
            </p>
            <p className="text-slate-400 text-sm mt-0.5">{w.pinyin}</p>
          </div>
          <Badge color={stateBadgeColor[w.card_state]}>{w.card_state}</Badge>
        </div>

        <p className="text-slate-700 font-medium mb-4">{w.meaning}</p>

        {w.part_of_speech && (
          <p className="text-xs text-slate-400 mb-3">
            <span className="font-semibold text-slate-500">Part of speech: </span>
            {w.part_of_speech}
          </p>
        )}

        {w.example_sentence && (
          <div className="bg-surface-light rounded-lg p-3 mb-4">
            <p className="text-slate-700" style={{ fontFamily: langConfig.fontFamily }}>
              {w.example_sentence}
            </p>
            {w.example_translation && (
              <p className="text-slate-400 text-xs mt-1">{w.example_translation}</p>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <StatPill label="Difficulty" value={`${w.difficulty} / 5`} />
          <StatPill
            label="Accuracy"
            value={accuracy !== null ? `${accuracy}%` : '—'}
            sub={w.total_reviews > 0 ? `${w.total_reviews} reviews` : 'Not reviewed yet'}
          />
          <StatPill
            label={isDue ? 'Due' : 'Next review'}
            value={isDue ? 'Now' : dueDate.toLocaleDateString()}
            highlight={isDue}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-300 mb-5">
          <span>Importance score: {w.importance_score}</span>
          <span>Frequency: {w.frequency_score}</span>
          <span>Added {new Date(w.created_at).toLocaleDateString()}</span>
        </div>

        <div className="flex gap-3">
          <Button onClick={onClose} variant="secondary" className="flex-1">
            Close
          </Button>
          <Button
            onClick={async () => {
              if (confirm(`Are you sure you want to delete "${w.chinese}"? This cannot be undone.`)) {
                await window.db.words.delete(w.id)
                onDelete()
              }
            }}
            variant="ghost"
            className="text-rose-400 hover:text-rose-500 hover:bg-rose-50"
          >
            🗑️
          </Button>
        </div>
      </motion.div>
    </>
  )
}

function StatPill({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className="bg-surface-light rounded-lg p-3 text-center">
      <p className={`text-sm font-semibold ${highlight ? 'text-rose-500' : 'text-slate-700'}`}>{value}</p>
      <p className="text-[11px] text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-300 mt-0.5">{sub}</p>}
    </div>
  )
}
