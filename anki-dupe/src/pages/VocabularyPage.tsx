import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import EmptyState from '../components/ui/EmptyState'
import Badge from '../components/ui/Badge'
import { SkeletonCard } from '../components/ui/SkeletonLoader'
import type { Word, Card } from '../types/db'

type Filter = 'all' | 'new' | 'learning' | 'review' | 'mastered'

const filterLabels: Record<Filter, string> = {
  all: 'All', new: 'New', learning: 'Learning', review: 'Review', mastered: 'Mastered',
}

const stateBadgeColor: Record<Card['state'], 'gray' | 'blue' | 'gold' | 'mint' | 'pink'> = {
  new: 'gray', learning: 'blue', review: 'gold', mastered: 'mint',
}

export default function VocabularyPage() {
  const navigate = useNavigate()
  const [words, setWords] = useState<Word[]>([])
  const [cardStates, setCardStates] = useState<Record<number, Card['state']>>({})
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([window.db.words.getAll(), window.db.cards.countByState()]).then(
      async ([ws]) => {
        setWords(ws)
        // Build word→state map from all cards
        const allCards = await Promise.all(ws.map((w) => window.db.cards.getByWordId(w.id)))
        const stateMap: Record<number, Card['state']> = {}
        allCards.flat().forEach((c) => {
          // Use the best state for each word
          const priority: Card['state'][] = ['mastered', 'review', 'learning', 'new']
          if (!stateMap[c.word_id] || priority.indexOf(c.state) < priority.indexOf(stateMap[c.word_id])) {
            stateMap[c.word_id] = c.state
          }
        })
        setCardStates(stateMap)
        setLoading(false)
      }
    )
  }, [])

  const filtered = words.filter((w) => {
    if (filter !== 'all' && cardStates[w.id] !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return w.chinese.includes(q) || w.pinyin.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q)
    }
    return true
  })

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
    <motion.div
      className="flex flex-col gap-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-700">Vocabulary</h1>
          <p className="text-slate-400 text-sm mt-0.5">{words.length} words in your library</p>
        </div>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by Chinese, pinyin, or meaning…"
        className="w-full px-4 py-2.5 rounded-md border border-surface-dark bg-white text-slate-700 text-sm outline-none focus:border-ice-blue transition-colors"
      />

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(filterLabels) as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={[
              'no-drag px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              filter === f
                ? 'bg-ice-blue text-slate-700'
                : 'bg-surface-medium text-slate-500 hover:bg-silver-blue',
            ].join(' ')}
          >
            {filterLabels[f]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="📚"
          title={words.length === 0 ? 'No words yet.' : 'No words match your filter.'}
          description={words.length === 0 ? 'Import content to start building your vocabulary.' : undefined}
          actionLabel={words.length === 0 ? 'Import Content' : undefined}
          onAction={words.length === 0 ? () => navigate('/import') : undefined}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((word) => (
            <motion.div
              key={word.id}
              layout
              className="bg-white rounded-lg shadow-soft p-4 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-chinese text-2xl font-bold text-slate-800">{word.chinese}</p>
                {cardStates[word.id] && (
                  <Badge color={stateBadgeColor[cardStates[word.id]]}>{cardStates[word.id]}</Badge>
                )}
              </div>
              <p className="text-slate-400 text-sm">{word.pinyin}</p>
              <p className="text-slate-600 text-sm font-medium">{word.meaning}</p>
              {word.example_sentence && (
                <p className="font-chinese text-xs text-slate-400 mt-1 truncate">{word.example_sentence}</p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
