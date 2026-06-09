import { ipcMain } from 'electron'
import { documentRepository } from '../database/repositories/documentRepository'
import { parseDocument } from '../services/docParser'
import { log } from '../utils/logger'

export function registerOcrHandlers(): void {
  // Process a single document by ID
  ipcMain.handle('ocr:processDocument', async (event, docId: number) => {
    const doc = documentRepository.getById(docId)
    if (!doc) return { ok: false, error: 'Document not found' }
    if (!doc.file_path) return { ok: false, error: 'No file path on document' }

    log(`Starting OCR for document: ${doc.title} (${docId})`)
    documentRepository.updateStatus(docId, 'processing')
    event.sender.send('ocr:progress', { docId, pct: 0, status: 'processing' })

    try {
      const result = await parseDocument(doc.file_path, doc.source_type, (pct) => {
        event.sender.send('ocr:progress', { docId, pct, status: 'processing' })
      })

      log(`OCR completed for document: ${doc.title}`)
      documentRepository.updateStatus(docId, 'done', result.text)
      event.sender.send('ocr:progress', { docId, pct: 100, status: 'done' })

      return { ok: true, data: documentRepository.getById(docId) }
    } catch (err) {
      log(`OCR failed for document ${doc.title}: ${(err as Error).message}`, 'error')
      documentRepository.updateStatus(docId, 'error')
      event.sender.send('ocr:progress', { docId, pct: 0, status: 'error' })
      return { ok: false, error: (err as Error).message }
    }
  })

  // Process all pending documents sequentially
  ipcMain.handle('ocr:processAll', async (event) => {
    const pending = documentRepository
      .getAll()
      .filter((d) => d.processing_status === 'pending' && d.file_path)

    log(`Batch OCR starting for ${pending.length} documents`)
    const results = []
    for (const doc of pending) {
      event.sender.send('ocr:progress', { docId: doc.id, pct: 0, status: 'processing' })
      documentRepository.updateStatus(doc.id, 'processing')

      try {
        const result = await parseDocument(doc.file_path!, doc.source_type, (pct) => {
          event.sender.send('ocr:progress', { docId: doc.id, pct, status: 'processing' })
        })
        documentRepository.updateStatus(doc.id, 'done', result.text)
        event.sender.send('ocr:progress', { docId: doc.id, pct: 100, status: 'done' })
        results.push({ id: doc.id, ok: true })
      } catch (err) {
        log(`OCR failed for document ${doc.title}: ${(err as Error).message}`, 'error')
        documentRepository.updateStatus(doc.id, 'error')
        event.sender.send('ocr:progress', { docId: doc.id, pct: 0, status: 'error' })
        results.push({ id: doc.id, ok: false, error: (err as Error).message })
      }
    }

    log(`Batch OCR completed`)
    return { ok: true, data: results }
  })
}
