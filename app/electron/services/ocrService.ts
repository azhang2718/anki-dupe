import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { getSettingsDb } from '../database/settingsDb'
import { LANGUAGE_CONFIGS, type LanguageCode } from '../database/languages'

let workerInstance: import('tesseract.js').Worker | null = null
let workerLangs: string[] = []

function getActiveLangs(): string[] {
  try {
    const row = getSettingsDb()
      .prepare("SELECT value FROM settings WHERE key = 'active_language'")
      .get() as { value: string } | undefined
    const lang = (row?.value ?? 'chinese') as LanguageCode
    return LANGUAGE_CONFIGS[lang]?.ocrLangs ?? ['eng', 'chi_sim']
  } catch {
    return ['eng', 'chi_sim']
  }
}

async function getWorker(langs: string[]): Promise<import('tesseract.js').Worker> {
  const langKey = [...langs].sort().join('+')
  const currentLangKey = [...workerLangs].sort().join('+')

  if (workerInstance && currentLangKey === langKey) return workerInstance

  if (workerInstance) {
    await workerInstance.terminate()
    workerInstance = null
  }

  const { createWorker } = await import('tesseract.js')

  const cacheDir = path.join(app.getPath('userData'), 'tessdata-cache')
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true })

  const cacheDirFwd = cacheDir.replace(/\\/g, '/')

  try {
    workerInstance = await createWorker(langs, 1, {
      cachePath: cacheDirFwd,
      gzip: true,
      logger: (_m) => { /* suppress */ },
    })
    workerLangs = langs
    return workerInstance
  } catch (err) {
    console.error('Failed to create Tesseract worker:', err)
    workerInstance = null
    workerLangs = []
    throw err
  }
}

export async function ocrImage(
  imagePath: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  const { setLogging } = await import('tesseract.js')
  setLogging(false)
  onProgress?.(10)

  try {
    const langs = getActiveLangs()
    const worker = await getWorker(langs)
    onProgress?.(30)
    const result = await worker.recognize(imagePath, {}, { text: true })
    onProgress?.(100)
    return result.data.text.trim()
  } catch (err) {
    console.error('OCR Error:', err)
    throw new Error(`OCR failed: ${(err as Error).message}`)
  }
}

export async function terminateOcrWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.terminate()
    workerInstance = null
    workerLangs = []
  }
}
