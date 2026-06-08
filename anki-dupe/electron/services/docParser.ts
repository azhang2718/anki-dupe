import fs from 'fs'
import path from 'path'
import { ocrImage } from './ocrService'

export type ParseResult = {
  text: string
  method: 'ocr' | 'text' | 'pdf' | 'docx'
}

export async function parseDocument(
  filePath: string,
  sourceType: string,
  onProgress?: (pct: number) => void
): Promise<ParseResult> {
  const ext = path.extname(filePath).toLowerCase()

  // Plain text formats
  if (sourceType === 'txt' || sourceType === 'srt') {
    const text = fs.readFileSync(filePath, 'utf-8')
    return { text: text.trim(), method: 'text' }
  }

  // Images — use Tesseract OCR
  if (sourceType === 'image' || ['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
    const text = await ocrImage(filePath, onProgress)
    return { text, method: 'ocr' }
  }

  // PDF — extract embedded text, fall back to OCR if empty
  if (sourceType === 'pdf' || ext === '.pdf') {
    try {
      const pdfParse = (await import('pdf-parse')).default
      const buffer = fs.readFileSync(filePath)
      const data = await pdfParse(buffer)
      const text = data.text.trim()
      if (text.length > 20) {
        onProgress?.(100)
        return { text, method: 'pdf' }
      }
    } catch {
      // fall through to OCR
    }
    // Scanned PDF with no embedded text — OCR first page as image
    const text = await ocrImage(filePath, onProgress)
    return { text, method: 'ocr' }
  }

  // DOCX — use mammoth to extract raw text
  if (sourceType === 'docx' || ext === '.docx') {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ path: filePath })
    onProgress?.(100)
    return { text: result.value.trim(), method: 'docx' }
  }

  throw new Error(`Unsupported file type: ${ext}`)
}
