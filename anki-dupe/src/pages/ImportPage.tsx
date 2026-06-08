import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import type { Document } from '../types/db'

const TYPE_ICONS: Record<string, string> = {
  image: '🖼️',
  pdf:   '📄',
  txt:   '📝',
  srt:   '🎞️',
  docx:  '📃',
  manual:'✏️',
}

const STATUS_COLORS: Record<string, 'blue' | 'gold' | 'mint' | 'pink'> = {
  pending:    'gold',
  processing: 'blue',
  done:       'mint',
  error:      'pink',
}

const STATUS_LABELS: Record<string, string> = {
  pending:    'Pending',
  processing: 'Processing…',
  done:       'Ready',
  error:      'Error',
}

function parentFolder(filePath: string): string {
  return filePath ? filePath.split(/[\\/]/).slice(-2, -1)[0] ?? '' : ''
}

export default function ImportPage() {
  const navigate = useNavigate()
  const [docs, setDocs] = useState<Document[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [importing, setImporting] = useState(false)
  const [processingAll, setProcessingAll] = useState(false)
  const [lastImported, setLastImported] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)
  // Map of docId → progress 0–100
  const [ocrProgress, setOcrProgress] = useState<Record<number, number>>({})
  const dragCounter = useRef(0)

  // Load documents and subscribe to OCR progress events
  useEffect(() => {
    window.db.documents.getAll().then(setDocs)

    const unsubscribe = window.importAPI.onProgress(({ docId, pct, status }) => {
      setOcrProgress((prev) => ({ ...prev, [docId]: pct }))

      if (status === 'done' || status === 'error') {
        // Refresh that document from DB
        window.db.documents.getById(docId).then((updated) => {
          if (updated) {
            setDocs((prev) => prev.map((d) => (d.id === docId ? updated : d)))
          }
          // Clean up progress entry after a short delay
          setTimeout(() => {
            setOcrProgress((prev) => {
              const next = { ...prev }
              delete next[docId]
              return next
            })
          }, 1500)
        })
      }
    })

    return () => unsubscribe()
  }, [])

  const handleImportResult = useCallback(
    (result: { ok: boolean; data?: Document[]; error?: string }) => {
      if (!result.ok || !result.data) {
        setError(result.error ?? 'Import failed')
        return
      }
      const incoming = result.data
      setLastImported(incoming.map((d) => d.id))
      setDocs((prev) => {
        const existingIds = new Set(prev.map((d) => d.id))
        return [
          ...incoming.filter((d) => !existingIds.has(d.id)),
          ...prev.map((d) => incoming.find((i) => i.id === d.id) ?? d),
        ]
      })
    },
    []
  )

  const openDialog = useCallback(async (type: 'files' | 'folder') => {
    setError(null)
    setImporting(true)
    try {
      const result = await window.importAPI.openDialog(type)
      handleImportResult(result)
    } finally {
      setImporting(false)
    }
  }, [handleImportResult])

  const processOne = useCallback(async (docId: number) => {
    setError(null)
    await window.importAPI.processDocument(docId)
    // UI update handled by onProgress listener
  }, [])

  const extractVocab = useCallback(async (docId: number) => {
    setError(null)
    setDocs((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, processing_status: 'processing' as const } : d))
    )
    const result = await window.claudeAPI.extractFromDocument(docId)
    if (!result.ok) {
      setError(result.error ?? 'Extraction failed')
      setDocs((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, processing_status: 'done' as const } : d))
      )
    } else {
      const updated = await window.db.documents.getById(docId)
      if (updated) setDocs((prev) => prev.map((d) => (d.id === docId ? updated : d)))
    }
  }, [])

  const processAll = useCallback(async () => {
    setError(null)
    setProcessingAll(true)
    try {
      await window.importAPI.processAll()
    } finally {
      setProcessingAll(false)
    }
  }, [])

  // Drag-and-drop
  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    dragCounter.current++
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragging(false)
  }, [])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
  }, [])

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    dragCounter.current = 0
    setIsDragging(false)
    setError(null)

    const paths: string[] = []
    for (const file of Array.from(e.dataTransfer.files)) {
      const p = (file as File & { path: string }).path
      if (p) paths.push(p)
    }
    if (!paths.length) return

    setImporting(true)
    try {
      const result = await window.importAPI.importPaths(paths)
      handleImportResult(result)
    } finally {
      setImporting(false)
    }
  }, [handleImportResult])

  const pendingCount    = docs.filter((d) => d.processing_status === 'pending').length
  const processingCount = docs.filter((d) => d.processing_status === 'processing').length
  const doneCount       = docs.filter((d) => d.processing_status === 'done').length

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-700">Import Content</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Add screenshots, PDFs, text files, or entire folders
          </p>
        </div>
        {pendingCount > 0 && (
          <Button
            onClick={processAll}
            variant="primary"
            disabled={processingAll || processingCount > 0}
          >
            {processingAll ? 'Processing…' : `Run OCR on ${pendingCount} file${pendingCount !== 1 ? 's' : ''}`}
          </Button>
        )}
      </div>

      {/* Drop zone */}
      <div
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={`
          relative rounded-lg border-2 border-dashed transition-all duration-200 py-12 px-8
          flex flex-col items-center justify-center gap-4 text-center cursor-default
          ${isDragging
            ? 'border-focus-blue bg-sky-blue/40 scale-[1.01]'
            : 'border-surface-dark bg-surface-light hover:border-silver-blue hover:bg-surface-medium'}
        `}
      >
        <AnimatePresence>
          {isDragging && (
            <motion.div
              className="absolute inset-0 rounded-lg border-2 border-focus-blue bg-sky-blue/20 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-focus-blue font-semibold text-lg">Drop to import</p>
            </motion.div>
          )}
        </AnimatePresence>

        {importing ? (
          <>
            <div className="w-8 h-8 border-2 border-ice-blue border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Importing files…</p>
          </>
        ) : (
          <>
            <div className="flex gap-2 text-3xl">
              <span>🖼️</span><span>📄</span><span>📝</span><span>📁</span>
            </div>
            <div>
              <p className="text-slate-600 font-medium">Drop files or folders here</p>
              <p className="text-slate-400 text-sm mt-1">
                PNG · JPG · WEBP · PDF · TXT · SRT · DOCX
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <Button onClick={() => openDialog('files')} variant="secondary" size="sm">
                Browse Files
              </Button>
              <Button onClick={() => openDialog('folder')} variant="ghost" size="sm">
                Open Folder
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Summary */}
      {docs.length > 0 && (
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>{docs.length} document{docs.length !== 1 ? 's' : ''}</span>
          {doneCount > 0 && <span className="text-emerald-500">· {doneCount} ready</span>}
          {pendingCount > 0 && <span className="text-amber-500">· {pendingCount} pending</span>}
          {processingCount > 0 && <span className="text-blue-400">· {processingCount} processing</span>}
        </div>
      )}

      {/* Document list */}
      {docs.length > 0 && (
        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {docs.map((doc) => (
              <motion.div
                key={doc.id}
                layout
                initial={lastImported.includes(doc.id) ? { opacity: 0, y: -8 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <DocumentRow
                  doc={doc}
                  isNew={lastImported.includes(doc.id)}
                  progress={ocrProgress[doc.id]}
                  onProcess={() => processOne(doc.id)}
                  onExtract={() => extractVocab(doc.id)}
                  onAnalyze={() => navigate(`/reading/${doc.id}`)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {docs.length === 0 && !importing && (
        <div className="text-center py-6">
          <p className="text-slate-300 text-sm">No documents yet — drop some files above to get started</p>
        </div>
      )}

      {/* Format guide */}
      <Card className="mt-2">
        <p className="text-xs font-semibold text-slate-500 mb-3">Supported Formats</p>
        <div className="grid grid-cols-3 gap-y-2 gap-x-4">
          {[
            { icon: '🖼️', label: 'Images',  desc: 'PNG, JPG, WEBP — Tesseract OCR extracts Chinese text' },
            { icon: '📄', label: 'PDF',     desc: 'Embedded text extracted; scanned PDFs use OCR' },
            { icon: '📝', label: 'TXT',     desc: 'Plain text files, read immediately' },
            { icon: '🎞️', label: 'SRT',     desc: 'Subtitle files from Chinese dramas & shows' },
            { icon: '📃', label: 'DOCX',    desc: 'Word documents — text extracted via mammoth' },
            { icon: '📁', label: 'Folder',  desc: 'Drop a folder — all files inside are imported' },
          ].map((f) => (
            <div key={f.label} className="flex items-start gap-2">
              <span className="text-base mt-0.5">{f.icon}</span>
              <div>
                <p className="text-xs font-semibold text-slate-600">{f.label}</p>
                <p className="text-[11px] text-slate-400 leading-snug">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function DocumentRow({
  doc,
  isNew,
  progress,
  onProcess,
  onExtract,
  onAnalyze,
}: {
  doc: Document
  isNew: boolean
  progress: number | undefined
  onProcess: () => void
  onExtract: () => void
  onAnalyze: () => void
}) {
  const folder = parentFolder(doc.file_path ?? '')
  const isProcessing = doc.processing_status === 'processing' || progress !== undefined
  const showProcess = doc.processing_status === 'pending' || doc.processing_status === 'error'

  return (
    <div className={`
      flex flex-col gap-2 px-4 py-3 rounded-lg border transition-colors
      ${isNew ? 'border-ice-blue bg-sky-blue/10' : 'border-surface-medium bg-white/60'}
    `}>
      <div className="flex items-center gap-3">
        <span className="text-xl shrink-0">{TYPE_ICONS[doc.source_type] ?? '📄'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-700 truncate">{doc.title}</p>
          {folder && (
            <p className="text-[11px] text-slate-400 truncate mt-0.5">…/{folder}/</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {doc.processing_status === 'done' && doc.word_count > 0 && (
            <span className="text-[11px] text-slate-400">
              {doc.word_count} words
              {doc.comprehension_score > 0 && (
                <span className={`ml-1 font-medium ${
                  doc.comprehension_score >= 80 ? 'text-emerald-500' :
                  doc.comprehension_score >= 50 ? 'text-amber-500' : 'text-rose-400'
                }`}>· {doc.comprehension_score}%</span>
              )}
            </span>
          )}
          {showProcess && !isProcessing && (
            <button
              onClick={onProcess}
              className="text-[11px] text-focus-blue hover:underline font-medium"
            >
              Run OCR
            </button>
          )}
          {doc.processing_status === 'done' && !isProcessing && (
            <>
              <button
                onClick={onExtract}
                className="text-[11px] text-emerald-500 hover:underline font-medium"
              >
                Extract Vocab
              </button>
              <button
                onClick={onAnalyze}
                className="text-[11px] text-violet-400 hover:underline font-medium"
              >
                Readiness →
              </button>
            </>
          )}
          <Badge color={STATUS_COLORS[doc.processing_status] ?? 'blue'}>
            {isProcessing && progress !== undefined
              ? `${progress}%`
              : STATUS_LABELS[doc.processing_status] ?? doc.processing_status}
          </Badge>
        </div>
      </div>
      {isProcessing && (
        <ProgressBar
          value={progress ?? 0}
          max={100}
          color="blue"
          size="sm"
          animated
        />
      )}
    </div>
  )
}
