import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap,
  useNodesState, useEdgesState, MarkerType,
  type Node, type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { motion, AnimatePresence } from 'framer-motion'

const STATE_COLORS: Record<string, string> = {
  new:      '#D4E1EE',  // silver-blue
  learning: '#A9D6FF',  // ice-blue
  review:   '#FFD866',  // xp-gold
  mastered: '#95F0C0',  // success-mint
}
const STATE_BORDER: Record<string, string> = {
  new:      '#B0C8E0',
  learning: '#7CB9FF',
  review:   '#FFC857',
  mastered: '#5DDC98',
}

type WordData = {
  id: number; chinese: string; pinyin: string; meaning: string
  difficulty: number; importance_score: number; best_state: string
}
type DocData = { id: number; title: string }
type EdgeData = { source: string; target: string; type: 'doc' | 'char' }

/** Simple force-like layout: docs in a row, words orbit their doc or grid below */
function buildLayout(words: WordData[], docs: DocData[]) {
  const nodes: Node[] = []
  const DOC_Y = 80
  const DOC_SPACING = 220

  // Document hub nodes
  const docXStart = Math.max(0, (words.length * 60 - docs.length * DOC_SPACING) / 2)
  for (let i = 0; i < docs.length; i++) {
    const d = docs[i]
    nodes.push({
      id: `doc-${d.id}`,
      type: 'default',
      position: { x: docXStart + i * DOC_SPACING, y: DOC_Y },
      data: { label: truncate(d.title, 18) },
      style: {
        background: '#EEF4FA',
        border: '2px solid #A9D6FF',
        borderRadius: 16,
        fontSize: 11,
        fontWeight: 600,
        color: '#475569',
        padding: '8px 14px',
        minWidth: 120,
        textAlign: 'center',
      },
    })
  }

  // Word nodes — orbit their doc, or fall into a grid
  const docPositions = new Map(
    nodes.filter((n) => n.id.startsWith('doc-')).map((n) => [n.id, n.position])
  )
  const docWordCounts = new Map<string, number>()

  for (const w of words) {
    const docId = w.source_document_id ? `doc-${w.source_document_id}` : null
    const size = 28 + Math.round(w.importance_score * 0.14)  // 28–42px

    let x: number, y: number
    if (docId && docPositions.has(docId)) {
      const idx = docWordCounts.get(docId) ?? 0
      docWordCounts.set(docId, idx + 1)
      const docPos = docPositions.get(docId)!
      const cols = 5
      const col = idx % cols
      const row = Math.floor(idx / cols)
      x = docPos.x - (cols * 80) / 2 + col * 80 + Math.random() * 20
      y = docPos.y + 90 + row * 80
    } else {
      // No doc — arrange in a grid at the bottom
      const unassignedIdx = words.filter((ww) => !ww.source_document_id).indexOf(w)
      const cols = 10
      x = (unassignedIdx % cols) * 90 + Math.random() * 15
      y = 460 + Math.floor(unassignedIdx / cols) * 85
    }

    nodes.push({
      id: `word-${w.id}`,
      type: 'default',
      position: { x, y },
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
        fontSize: w.chinese.length === 1 ? 16 : w.chinese.length <= 2 ? 13 : 11,
        fontWeight: 700,
        color: '#1e293b',
        fontFamily: '"Noto Sans SC", sans-serif',
        cursor: 'pointer',
        padding: 0,
      },
    })
  }

  return nodes
}

function buildEdges(rawEdges: EdgeData[]): Edge[] {
  return rawEdges.map((e, i) => ({
    id: `e-${i}`,
    source: e.source,
    target: e.target,
    style: {
      stroke: e.type === 'doc' ? '#A9D6FF' : '#FFD866',
      strokeWidth: e.type === 'doc' ? 1.5 : 0.8,
      opacity: e.type === 'doc' ? 0.6 : 0.3,
    },
    markerEnd: e.type === 'doc' ? { type: MarkerType.Arrow, width: 8, height: 8, color: '#A9D6FF' } : undefined,
    animated: false,
  }))
}

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max) + '…' : s
}

export default function KnowledgeGraphPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<WordData | null>(null)
  const [stats, setStats] = useState({ total: 0, mastered: 0, docs: 0 })
  const [filter, setFilter] = useState<string>('all')

  const load = useCallback(async () => {
    setLoading(true)
    const data = await window.db.words.getGraphData()
    const filteredWords = filter === 'all'
      ? data.words
      : data.words.filter((w) => w.best_state === filter)

    setNodes(buildLayout(filteredWords, data.docs))
    setEdges(buildEdges(
      filter === 'all'
        ? data.edges
        : data.edges.filter((e) =>
            filteredWords.some((w) => `word-${w.id}` === e.source || `word-${w.id}` === e.target)
          )
    ))
    setStats({
      total: data.words.length,
      mastered: data.words.filter((w) => w.best_state === 'mastered').length,
      docs: data.docs.length,
    })
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const wd = (node.data as { wordData?: WordData }).wordData
    if (wd) setSelected(wd)
  }, [])

  const filterButtons = useMemo(() => [
    { key: 'all',      label: 'All',      color: '#94a3b8' },
    { key: 'new',      label: 'New',      color: STATE_COLORS.new },
    { key: 'learning', label: 'Learning', color: STATE_COLORS.learning },
    { key: 'review',   label: 'Review',   color: STATE_COLORS.review },
    { key: 'mastered', label: 'Mastered', color: STATE_COLORS.mastered },
  ], [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-8 h-8 border-2 border-ice-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Building graph…</p>
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-5xl">🕸️</p>
        <p className="text-xl font-semibold text-slate-700">No words yet</p>
        <p className="text-slate-400 text-sm">Import content and extract vocabulary to see the graph.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-0 -mx-6 -my-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white/80 border-b border-surface-medium shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-600">Knowledge Graph</span>
          <span className="text-xs text-slate-400">
            {stats.total} words · {stats.mastered} mastered · {stats.docs} document{stats.docs !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {filterButtons.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="no-drag px-2.5 py-1 rounded-full text-xs font-medium transition-all"
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

      {/* Graph */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.1}
          maxZoom={3}
          nodesDraggable
          panOnDrag
          zoomOnScroll
          nodesConnectable={false}
          elementsSelectable
        >
          <Background color="#EEF4FA" gap={20} />
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={(n) => {
              const wd = (n.data as { wordData?: WordData }).wordData
              return wd ? (STATE_COLORS[wd.best_state] ?? '#D4E1EE') : '#A9D6FF'
            }}
            style={{ borderRadius: 12 }}
          />
        </ReactFlow>

        {/* Legend */}
        <div className="absolute bottom-16 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-soft p-3 flex flex-col gap-1.5 pointer-events-none">
          {Object.entries(STATE_COLORS).map(([state, color]) => (
            <div key={state} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border" style={{ background: color, borderColor: STATE_BORDER[state] }} />
              <span className="text-xs text-slate-500 capitalize">{state}</span>
            </div>
          ))}
          <div className="border-t border-surface-medium mt-1 pt-1.5 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-px" style={{ background: '#A9D6FF' }} />
              <span className="text-[10px] text-slate-400">From document</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-px" style={{ background: '#FFD866', opacity: 0.6 }} />
              <span className="text-[10px] text-slate-400">Shared character</span>
            </div>
          </div>
        </div>

        {/* Word detail panel */}
        <AnimatePresence>
          {selected && (
            <motion.div
              className="absolute top-4 right-4 w-56 bg-white rounded-xl shadow-modal p-4 flex flex-col gap-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-start justify-between">
                <p className="font-chinese text-3xl font-bold text-slate-800">{selected.chinese}</p>
                <button
                  onClick={() => setSelected(null)}
                  className="text-slate-300 hover:text-slate-500 text-lg leading-none mt-0.5"
                >×</button>
              </div>
              <p className="text-slate-400 text-xs">{selected.pinyin}</p>
              <p className="text-slate-700 text-sm font-medium leading-snug">{selected.meaning}</p>
              <div className="flex items-center justify-between mt-1 pt-2 border-t border-surface-light text-xs">
                <span
                  className="px-2 py-0.5 rounded-full font-medium capitalize"
                  style={{ background: STATE_COLORS[selected.best_state], color: '#1e293b' }}
                >
                  {selected.best_state}
                </span>
                <span className="text-slate-400">diff {selected.difficulty}/5</span>
                <span className="text-slate-300">★{selected.importance_score}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
