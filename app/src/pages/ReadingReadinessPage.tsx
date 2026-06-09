import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import type { Document, ReadinessResult } from '../types/db'

function ScoreRing({ score }: { score: number }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ

  let color = '#FFB6C1'  // error-pink
  if (score >= 80) color = '#95F0C0'       // success-mint
  else if (score >= 50) color = '#FFD866'  // xp-gold

  return (
    <svg width={128} height={128} viewBox="0 0 128 128">
      <circle cx={64} cy={64} r={r} fill="none" stroke="#EEF4FA" strokeWidth={10} />
      <circle
        cx={64} cy={64} r={r}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform="rotate(-90 64 64)"
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
      <text x={64} y={64} textAnchor="middle" dominantBaseline="central"
        fill="#334155" fontSize={22} fontWeight={700}>
        {score}%
      </text>
    </svg>
  )
}

function readinessLabel(score: number): { label: string; color: string; emoji: string } {
  if (score >= 90) return { label: 'Ready to read!',      color: 'text-emerald-600', emoji: '🎉' }
  if (score >= 70) return { label: 'Almost ready',        color: 'text-emerald-500', emoji: '📗' }
  if (score >= 50) return { label: 'Getting there',       color: 'text-amber-500',   emoji: '📙' }
  if (score >= 25) return { label: 'Keep studying',       color: 'text-amber-600',   emoji: '📖' }
  return                  { label: 'Start with basics',   color: 'text-rose-500',    emoji: '🌱' }
}

export default function ReadingReadinessPage() {
  const { docId } = useParams<{ docId: string }>()
  const navigate = useNavigate()
  const [doc, setDoc] = useState<Document | null>(null)
  const [result, setResult] = useState<ReadinessResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!docId) return
    const id = Number(docId)
    window.db.documents.getById(id).then(setDoc)
    window.db.documents
      .analyzeReadiness(id)
      .then((r) => { setResult(r); setLoading(false) })
      .catch((e: Error) => { setError(e.message); setLoading(false) })
  }, [docId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-8 h-8 border-2 border-ice-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Analyzing reading readiness…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-4xl">⚠️</p>
        <p className="text-slate-600 font-medium">Analysis failed</p>
        <p className="text-slate-400 text-sm text-center max-w-sm">{error}</p>
        <Button onClick={() => navigate('/import')} variant="secondary">Back to Import</Button>
      </div>
    )
  }

  if (!result) return null

  const { label, color, emoji } = readinessLabel(result.comprehensionScore)

  return (
    <motion.div
      className="flex flex-col gap-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Back */}
      <button
        onClick={() => navigate('/import')}
        className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 w-fit"
      >
        ← Back to Import
      </button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-700">Reading Readiness</h1>
        {doc && <p className="text-slate-400 text-sm mt-0.5 truncate">{doc.title}</p>}
      </div>

      {/* Score card */}
      <Card>
        <div className="flex items-center gap-8">
          <ScoreRing score={result.comprehensionScore} />
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{emoji}</span>
              <span className={`text-lg font-semibold ${color}`}>{label}</span>
            </div>
            <p className="text-slate-500 text-sm">
              You know <span className="font-semibold text-slate-700">{result.knownCount}</span> of{' '}
              <span className="font-semibold text-slate-700">{result.totalVocabFound}</span> vocabulary
              words found in this document.
            </p>
            {result.totalVocabFound === 0 && (
              <p className="text-slate-400 text-xs">
                No vocabulary words matched — try extracting vocabulary first.
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Progress breakdown */}
      {result.totalVocabFound > 0 && (
        <Card>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
            Vocabulary Breakdown
          </p>
          <div className="flex flex-col gap-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600">Known words</span>
                <span className="text-emerald-600 font-medium">{result.knownCount} ({result.comprehensionScore}%)</span>
              </div>
              <ProgressBar value={result.knownCount} max={result.totalVocabFound} color="mint" size="sm" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600">Still learning</span>
                <span className="text-amber-500 font-medium">
                  {result.totalVocabFound - result.knownCount} ({100 - result.comprehensionScore}%)
                </span>
              </div>
              <ProgressBar
                value={result.totalVocabFound - result.knownCount}
                max={result.totalVocabFound}
                color="gold"
                size="sm"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Unknown words to study */}
      {result.unknownWords.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Words to study ({result.unknownWords.length})
            </h2>
            <button
              onClick={() => navigate('/review')}
              className="text-xs text-focus-blue hover:underline font-medium"
            >
              Study now →
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {result.unknownWords.slice(0, 40).map((w) => (
              <motion.div
                key={w.id}
                layout
                className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-surface-medium shadow-soft"
              >
                <span className="font-chinese text-xl font-bold text-slate-800 w-16 shrink-0">{w.chinese}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400">{w.pinyin}</p>
                  <p className="text-sm text-slate-600 font-medium truncate">{w.meaning}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-slate-300">★{w.importance_score}</span>
                  <Badge color={w.card_state === 'new' ? 'gray' : 'blue'}>
                    {w.card_state}
                  </Badge>
                </div>
              </motion.div>
            ))}
            {result.unknownWords.length > 40 && (
              <p className="text-xs text-slate-400 text-center py-2">
                +{result.unknownWords.length - 40} more words not shown
              </p>
            )}
          </div>
        </section>
      )}

      {/* CTA when ready */}
      {result.comprehensionScore >= 80 && (
        <Card className="bg-success-mint/10 border-success-mint/30">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎉</span>
            <div>
              <p className="font-semibold text-emerald-700">You're ready to read this!</p>
              <p className="text-emerald-600 text-sm mt-0.5">
                You know {result.comprehensionScore}% of the vocabulary. Give it a try!
              </p>
            </div>
          </div>
        </Card>
      )}
    </motion.div>
  )
}
