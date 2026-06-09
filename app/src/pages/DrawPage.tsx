import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowCounterClockwise, MagnifyingGlass } from '@phosphor-icons/react'
import type { Word } from '../types/db'
import { LANGUAGE_CONFIGS, type LanguageCode } from '../types/languages'

// ─── Types ───────────────────────────────────────────────────────────────────

type MatchResult = {
  source: 'db' | 'claude'
  chinese: string
  pinyin: string
  meaning: string
  confidence: 'high' | 'medium' | 'low'
  word?: Word
}

// ─── Canvas drawing hook ──────────────────────────────────────────────────────

function useDrawCanvas(canvasRef: React.RefObject<HTMLCanvasElement>) {
  const drawing = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const src = 'touches' in e ? e.touches[0] : e
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top) * scaleY,
    }
  }

  const clear = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }, [canvasRef])

  const isEmpty = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return true
    const ctx = canvas.getContext('2d')!
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    return !data.some((v, i) => i % 4 === 3 && v > 0)
  }, [canvasRef])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 8
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const onDown = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()
      drawing.current = true
      lastPos.current = getPos(e, canvas)
      ctx.beginPath()
      const p = lastPos.current
      ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2)
      ctx.fillStyle = '#1e293b'
      ctx.fill()
    }

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!drawing.current || !lastPos.current) return
      e.preventDefault()
      const pos = getPos(e, canvas)
      ctx.beginPath()
      ctx.moveTo(lastPos.current.x, lastPos.current.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
      lastPos.current = pos
    }

    const onUp = () => { drawing.current = false; lastPos.current = null }

    canvas.addEventListener('mousedown', onDown)
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseup', onUp)
    canvas.addEventListener('mouseleave', onUp)
    canvas.addEventListener('touchstart', onDown, { passive: false })
    canvas.addEventListener('touchmove', onMove, { passive: false })
    canvas.addEventListener('touchend', onUp)

    return () => {
      canvas.removeEventListener('mousedown', onDown)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseup', onUp)
      canvas.removeEventListener('mouseleave', onUp)
      canvas.removeEventListener('touchstart', onDown)
      canvas.removeEventListener('touchmove', onMove)
      canvas.removeEventListener('touchend', onUp)
    }
  }, [canvasRef])

  return { clear, isEmpty }
}

// ─── Matching logic ───────────────────────────────────────────────────────────

async function matchFromDb(imageDataUrl: string): Promise<MatchResult | null> {
  // Get all vocabulary words and compare drawn strokes via OCR-like heuristic:
  // We extract the drawn character using a simple bounding-box crop and compare
  // against known characters. Since we can't do real stroke matching client-side,
  // we use the Claude API with vision — but first check if the result is in the DB.
  return null // DB matching is done after Claude identifies the character
}

async function identifyWithClaude(imageDataUrl: string): Promise<{ chinese: string; pinyin: string; meaning: string; confidence: string }> {
  const result = await (window as any).claudeAPI.identifyCharacter(imageDataUrl)
  return result
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const STATE_COLORS: Record<string, string> = {
  new: '#D4E1EE', learning: '#A9D6FF', review: '#FFD866', mastered: '#95F0C0',
}

export default function DrawPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null!)
  const { clear, isEmpty } = useDrawCanvas(canvasRef)
  const [result, setResult] = useState<MatchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasDrawing, setHasDrawing] = useState(false)
  const [offline, setOffline] = useState(false)
  const [activeLang, setActiveLang] = useState<LanguageCode>('chinese')

  useEffect(() => {
    Promise.all([
      window.db.settings.get('offline_mode'),
      window.db.language.get(),
    ]).then(([offline, lang]) => {
      setOffline(offline === 'true')
      setActiveLang((lang ?? 'chinese') as LanguageCode)
    }).catch(() => null)
  }, [])

  // Track whether canvas has content
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const id = setInterval(() => setHasDrawing(!isEmpty()), 200)
    return () => clearInterval(id)
  }, [isEmpty])

  const handleClear = () => {
    clear()
    setResult(null)
    setError(null)
    setHasDrawing(false)
  }

  const handleIdentify = useCallback(async () => {
    if (isEmpty()) return
    setLoading(true)
    setError(null)
    setResult(null)

    if (offline) { setError('Offline mode is on — character identification requires Claude API. Disable it in Settings.'); return }
    try {
      const canvas = canvasRef.current
      // Render on white background for better recognition
      const offscreen = document.createElement('canvas')
      offscreen.width = canvas.width
      offscreen.height = canvas.height
      const octx = offscreen.getContext('2d')!
      octx.fillStyle = '#ffffff'
      octx.fillRect(0, 0, offscreen.width, offscreen.height)
      octx.drawImage(canvas, 0, 0)
      const dataUrl = offscreen.toDataURL('image/png')

      const identified = await identifyWithClaude(dataUrl)

      // Try to match identified character against vocabulary DB
      let dbWord: Word | null = null
      if (identified.chinese && identified.chinese !== '?') {
        try {
          dbWord = await window.db.words.getByChinese(identified.chinese) as Word | null
        } catch { /* word not in DB, that's fine */ }
      }

      if (dbWord) {
        setResult({
          source: 'db',
          chinese: dbWord.chinese,
          pinyin: dbWord.pinyin,
          meaning: dbWord.meaning,
          confidence: identified.confidence as 'high' | 'medium' | 'low',
          word: dbWord,
        })
      } else {
        setResult({
          source: 'claude',
          chinese: identified.chinese ?? '?',
          pinyin: identified.pinyin ?? '',
          meaning: identified.meaning ?? 'Unknown',
          confidence: identified.confidence as 'high' | 'medium' | 'low',
        })
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [isEmpty])

  const confidenceColor = (c: string) =>
    c === 'high' ? '#95F0C0' : c === 'medium' ? '#FFD866' : '#FFB3B3'

  const langConfig = LANGUAGE_CONFIGS[activeLang]
  const hintChars: Record<LanguageCode, string> = {
    chinese: '写',
    japanese: '書',
    korean: '쓰',
  }

  return (
    <div className="flex flex-col items-center gap-8 max-w-lg mx-auto py-8">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-slate-700">{langConfig.charLabel} Recognition</h1>
        <p className="text-sm text-slate-400 mt-1">
          Draw a {langConfig.name} {langConfig.charLabel.toLowerCase()} — we'll identify it from your vocabulary or ask Claude
        </p>
      </div>

      {/* Drawing canvas */}
      <div className="relative">
        <div
          className="rounded-xl shadow-soft overflow-hidden border border-surface-medium"
          style={{ background: '#fff' }}
        >
          {/* Grid lines for guidance */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={320} height={320}
            style={{ opacity: 0.08 }}
          >
            <line x1="160" y1="0" x2="160" y2="320" stroke="#94a3b8" strokeWidth="1" strokeDasharray="6 4" />
            <line x1="0" y1="160" x2="320" y2="160" stroke="#94a3b8" strokeWidth="1" strokeDasharray="6 4" />
            <line x1="80" y1="0" x2="80" y2="320" stroke="#cbd5e1" strokeWidth="0.5" />
            <line x1="240" y1="0" x2="240" y2="320" stroke="#cbd5e1" strokeWidth="0.5" />
            <line x1="0" y1="80" x2="320" y2="80" stroke="#cbd5e1" strokeWidth="0.5" />
            <line x1="0" y1="240" x2="320" y2="240" stroke="#cbd5e1" strokeWidth="0.5" />
          </svg>
          <canvas
            ref={canvasRef}
            width={320}
            height={320}
            className="block cursor-crosshair"
            style={{ touchAction: 'none', userSelect: 'none', width: 320, height: 320 }}
          />
        </div>

        {/* Empty state hint */}
        {!hasDrawing && !loading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-slate-300 text-4xl font-light select-none" style={{ fontFamily: langConfig.fontFamily }}>
              {hintChars[activeLang]}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleClear}
          disabled={!hasDrawing && !result}
          className="no-drag flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium text-slate-500 bg-surface-medium hover:bg-silver-blue transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowCounterClockwise size={15} />
          Clear
        </button>
        <motion.button
          onClick={handleIdentify}
          disabled={!hasDrawing || loading}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
          className="no-drag flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-semibold bg-ice-blue text-slate-700 hover:bg-focus-blue hover:text-white shadow-soft transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <MagnifyingGlass size={15} weight="bold" />
          )}
          {loading ? 'Identifying…' : offline ? 'Offline' : 'Identify'}
        </motion.button>
      </div>

      {/* Error */}
      {error && (
        <div className="w-full max-w-sm bg-error-pink/20 border border-error-pink/40 rounded-lg px-4 py-3 text-sm text-slate-600">
          {error}
        </div>
      )}

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            className="w-full max-w-sm bg-white rounded-xl shadow-modal overflow-hidden"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="px-6 pt-6 pb-4 flex items-start gap-5">
              <p
                className="text-6xl font-bold text-slate-800 leading-none shrink-0"
                style={{ fontFamily: langConfig.fontFamily }}
              >
                {result.chinese}
              </p>
              <div className="flex flex-col gap-1 pt-1 min-w-0">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{langConfig.readingLabel}</p>
                <p className="text-slate-500 text-sm tracking-wide">{result.pinyin}</p>
                <p className="text-slate-700 font-medium text-sm leading-snug mt-0.5">{result.meaning}</p>
              </div>
            </div>

            <div className="px-6 pb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
                  style={{ background: confidenceColor(result.confidence), color: '#1e293b' }}
                >
                  {result.confidence} confidence
                </span>
                <span className="text-[10px] text-slate-400">
                  {result.source === 'db' ? 'matched in your vocabulary' : 'identified by Claude'}
                </span>
              </div>

              {result.word && (
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
                  style={{
                    background: STATE_COLORS[(result.word as any).card_state ?? 'new'] ?? STATE_COLORS.new,
                    color: '#1e293b',
                  }}
                >
                  in your deck
                </span>
              )}
            </div>

            {result.source === 'claude' && result.chinese !== '?' && (
              <div className="border-t border-surface-light px-6 py-3 bg-surface-light/50">
                <p className="text-[11px] text-slate-400">
                  This character isn't in your vocabulary yet. Extract it from a document to start studying it.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
