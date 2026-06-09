import { useEffect, useState, useCallback, useRef } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap, ReactFlowProvider,
  useNodesState, useEdgesState, useReactFlow,
  type Node, type Edge,
} from '@xyflow/react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from '@phosphor-icons/react'

// ─── Types ───────────────────────────────────────────────────────────────────

type WordData = {
  id: number
  chinese: string
  pinyin: string
  meaning: string
  difficulty: number
  importance_score: number
  category: string
  best_state: string
}

type HoverWord = WordData & { nodeX: number; nodeY: number }

// ─── Constants ────────────────────────────────────────────────────────────────

const STATE_COLORS: Record<string, string> = {
  new:      '#D4E1EE',
  learning: '#A9D6FF',
  review:   '#FFD866',
  mastered: '#95F0C0',
}
const STATE_BORDER: Record<string, string> = {
  new:      '#B0C8E0',
  learning: '#7CB9FF',
  review:   '#FFC857',
  mastered: '#5DDC98',
}

// Visual identity per category — hub color, label emoji
const CATEGORY_META: Record<string, { color: string; border: string; emoji: string }> = {
  'Food & Drink':          { color: '#FFE4B8', border: '#F59E0B', emoji: '🍜' },
  'Work & Business':       { color: '#DBEAFE', border: '#3B82F6', emoji: '💼' },
  'Travel & Places':       { color: '#D1FAE5', border: '#10B981', emoji: '✈️' },
  'Daily Life':            { color: '#EDE9FE', border: '#8B5CF6', emoji: '🏠' },
  'People & Society':      { color: '#FCE7F3', border: '#EC4899', emoji: '👥' },
  'Nature & Environment':  { color: '#D1FAE5', border: '#059669', emoji: '🌿' },
  'Time & Numbers':        { color: '#F3F4F6', border: '#6B7280', emoji: '🕐' },
  'Health & Body':         { color: '#FEE2E2', border: '#EF4444', emoji: '❤️' },
  'Education & Culture':   { color: '#FEF3C7', border: '#D97706', emoji: '📖' },
  'Emotions & Character':  { color: '#FCE7F3', border: '#DB2777', emoji: '💭' },
  'Tech & Media':          { color: '#DBEAFE', border: '#2563EB', emoji: '💻' },
  'Other':                 { color: '#F1F5F9', border: '#94A3B8', emoji: '📦' },
}

function getCategoryMeta(cat: string) {
  return CATEGORY_META[cat] ?? CATEGORY_META['Other']
}

// ─── Layout ───────────────────────────────────────────────────────────────────

function buildGraph(words: WordData[]): { nodes: Node[]; edges: Edge[] } {
  // Group words by category
  const byCategory = new Map<string, WordData[]>()
  for (const w of words) {
    const cat = w.category || 'Other'
    if (!byCategory.has(cat)) byCategory.set(cat, [])
    byCategory.get(cat)!.push(w)
  }

  const categories = [...byCategory.keys()]
  const catCount = categories.length
  const nodes: Node[] = []
  const edges: Edge[] = []

  // Place category hubs in a circle; word nodes orbit each hub
  const HUB_RADIUS = Math.max(320, catCount * 70)

  categories.forEach((cat, ci) => {
    const angle = (2 * Math.PI * ci) / catCount - Math.PI / 2
    const hubX = Math.cos(angle) * HUB_RADIUS
    const hubY = Math.sin(angle) * HUB_RADIUS

    const meta = getCategoryMeta(cat)
    const catWords = byCategory.get(cat)!

    // Hub node
    const hubId = `cat-${ci}`
    nodes.push({
      id: hubId,
      type: 'default',
      position: { x: hubX, y: hubY },
      data: { label: `${meta.emoji} ${cat}`, isCategoryHub: true, category: cat },
      style: {
        background: meta.color,
        border: `2px solid ${meta.border}`,
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        color: '#1e293b',
        padding: '8px 14px',
        minWidth: 130,
        textAlign: 'center',
        cursor: 'default',
        boxShadow: `0 2px 12px ${meta.border}30`,
      },
    })

    // Word nodes orbit the hub
    const wordCount = catWords.length
    const WORD_RADIUS = Math.max(90, Math.min(160, wordCount * 14))
    catWords.forEach((w, wi) => {
      const wAngle = (2 * Math.PI * wi) / wordCount - Math.PI / 2
      // Stagger onto two rings if many words
      const ring = wordCount > 12 ? (wi % 2 === 0 ? WORD_RADIUS : WORD_RADIUS * 1.6) : WORD_RADIUS
      const wx = hubX + Math.cos(wAngle) * ring
      const wy = hubY + Math.sin(wAngle) * ring

      const size = 30 + Math.round(Math.min(w.importance_score, 100) * 0.12)
      const wordId = `word-${w.id}`

      nodes.push({
        id: wordId,
        type: 'default',
        position: { x: wx, y: wy },
        data: { wordData: w, label: w.chinese },
        style: {
          background: STATE_COLORS[w.best_state] ?? STATE_COLORS.new,
          border: `2px solid ${STATE_BORDER[w.best_state] ?? STATE_BORDER.new}`,
          borderRadius: '50%',
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: w.chinese.length === 1 ? 15 : w.chinese.length <= 2 ? 12 : 10,
          fontWeight: 700,
          color: '#1e293b',
          fontFamily: '"Noto Sans SC", sans-serif',
          cursor: 'pointer',
          padding: 0,
        },
      })

      edges.push({
        id: `e-${hubId}-${wordId}`,
        source: hubId,
        target: wordId,
        style: {
          stroke: meta.border,
          strokeWidth: 1,
          opacity: 0.25,
        },
        animated: false,
      })
    })
  })

  return { nodes, edges }
}

// ─── Canvas ───────────────────────────────────────────────────────────────────

function GraphCanvas({
  filter,
  onStats,
  onHover,
}: {
  filter: string
  onStats: (s: { total: number; mastered: number; categories: number }) => void
  onHover: (word: HoverWord | null) => void
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [loading, setLoading] = useState(true)
  const { fitView, getViewport, setViewport, fitBounds } = useReactFlow()
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await window.db.words.getGraphData() as { words: WordData[] }
      const filtered = filter === 'all'
        ? data.words
        : data.words.filter((w) => w.best_state === filter)

      const { nodes: n, edges: e } = buildGraph(filtered)
      setNodes(n)
      setEdges(e)
      onStats({
        total: data.words.length,
        mastered: data.words.filter((w) => w.best_state === 'mastered').length,
        categories: new Set(data.words.map((w) => w.category)).size,
      })
    } catch (err) {
      console.error(err)
      setNodes([])
      setEdges([])
    } finally {
      setLoading(false)
    }
  }, [filter, onStats, setNodes, setEdges])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!loading && nodes.length > 0) {
      requestAnimationFrame(() => fitView({ padding: 0.12, duration: 400 }))
    }
  }, [loading, nodes.length, fitView])

  const onNodeMouseEnter = useCallback((_: React.MouseEvent, node: Node) => {
    const wd = (node.data as { wordData?: WordData }).wordData
    if (!wd) return

    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)

    hoverTimerRef.current = setTimeout(() => {
      // Zoom smoothly toward the hovered node
      const { zoom } = getViewport()
      const targetZoom = Math.max(zoom, 1.8)
      setViewport(
        {
          x: -node.position.x * targetZoom + window.innerWidth / 2,
          y: -node.position.y * targetZoom + window.innerHeight / 2,
          zoom: targetZoom,
        },
        { duration: 350 }
      )
      onHover({ ...wd, nodeX: node.position.x, nodeY: node.position.y })
    }, 120)
  }, [getViewport, setViewport, onHover])

  const onNodeMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-7 h-7 border-2 border-ice-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading graph…</p>
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Graph size={40} className="text-slate-300" />
        <p className="text-slate-500 font-semibold">No words yet</p>
        <p className="text-slate-400 text-xs">Import content and extract vocabulary to see the graph.</p>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        minZoom={0.08}
        maxZoom={4}
        nodesDraggable={false}
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#EEF4FA" gap={24} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(n) => {
            const wd = (n.data as { wordData?: WordData }).wordData
            return wd ? (STATE_COLORS[wd.best_state] ?? '#D4E1EE') : '#E2E8F0'
          }}
          style={{ borderRadius: 10 }}
        />
      </ReactFlow>
    </div>
  )
}

// ─── Import Graph icon locally to avoid needing a separate import ─────────────
function Graph({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" className={className} fill="currentColor">
      <path d="M200,152a47.8,47.8,0,0,0-27.46,8.68L133.62,124A48,48,0,0,0,96,48a48,48,0,1,0,34.34,81.81l39.35,36.81A48,48,0,1,0,200,152ZM96,128a32,32,0,1,1,32-32A32,32,0,0,1,96,128Zm104,72a32,32,0,1,1,32-32A32,32,0,0,1,200,200Z"/>
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KnowledgeGraphPage() {
  const [hovered, setHovered] = useState<HoverWord | null>(null)
  const [stats, setStats] = useState({ total: 0, mastered: 0, categories: 0 })
  const [filter, setFilter] = useState<string>('all')

  const filterButtons = [
    { key: 'all',      label: 'All',      color: '#94a3b8' },
    { key: 'new',      label: 'New',      color: STATE_COLORS.new },
    { key: 'learning', label: 'Learning', color: STATE_COLORS.learning },
    { key: 'review',   label: 'Review',   color: STATE_COLORS.review },
    { key: 'mastered', label: 'Mastered', color: STATE_COLORS.mastered },
  ]

  return (
    <div className="flex flex-col -mx-8 -my-8 h-[calc(100vh-2.25rem)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-white/80 border-b border-surface-medium shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-600">Knowledge Graph</span>
          <span className="text-xs text-slate-400">
            {stats.total} words · {stats.mastered} mastered · {stats.categories} categories
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {filterButtons.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="no-drag px-2.5 py-1 rounded-full text-xs font-medium transition-colors duration-150"
              style={{
                background: filter === f.key ? f.color : '#EEF4FA',
                color: filter === f.key ? '#1e293b' : '#64748b',
                border: filter === f.key ? `1.5px solid ${f.color}` : '1.5px solid transparent',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Graph + overlays */}
      <div
        className="flex-1 min-h-0 relative"
        onMouseLeave={() => setHovered(null)}
      >
        <ReactFlowProvider>
          <GraphCanvas filter={filter} onStats={setStats} onHover={setHovered} />
        </ReactFlowProvider>

        {/* State legend */}
        <div className="absolute bottom-16 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-soft p-3 flex flex-col gap-1.5 pointer-events-none z-10">
          {Object.entries(STATE_COLORS).map(([state, color]) => (
            <div key={state} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full border"
                style={{ background: color, borderColor: STATE_BORDER[state] }}
              />
              <span className="text-xs text-slate-500 capitalize">{state}</span>
            </div>
          ))}
        </div>

        {/* Hover word popup */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              key={hovered.id}
              className="absolute top-4 right-4 w-56 bg-white rounded-xl shadow-modal p-4 flex flex-col gap-2 z-20 pointer-events-none"
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0,  scale: 1 }}
              exit={{    opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-3xl font-bold text-slate-800 leading-none"
                  style={{ fontFamily: '"Noto Sans SC", sans-serif' }}
                >
                  {hovered.chinese}
                </p>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 mt-0.5 capitalize"
                  style={{
                    background: STATE_COLORS[hovered.best_state] ?? STATE_COLORS.new,
                    color: '#1e293b',
                  }}
                >
                  {hovered.best_state}
                </span>
              </div>
              <p className="text-slate-400 text-xs tracking-wide">{hovered.pinyin}</p>
              <p className="text-slate-700 text-sm font-medium leading-snug">{hovered.meaning}</p>
              <div className="pt-1.5 border-t border-surface-light flex items-center justify-between text-[10px] text-slate-400">
                <span>{getCategoryMeta(hovered.category).emoji} {hovered.category}</span>
                <span>diff {hovered.difficulty}/5</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hint */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 pointer-events-none select-none">
          Hover a word to preview · Scroll to zoom · Drag to pan
        </div>
      </div>
    </div>
  )
}
