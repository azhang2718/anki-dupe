import { app } from 'electron'
import path from 'path'
import fs from 'fs'

let workerInstance: import('tesseract.js').Worker | null = null
let workerLangs: string[] = []

async function getWorker(langs: string[]): Promise<import('tesseract.js').Worker> {
  const langKey = [...langs].sort().join('+')
  const currentLangKey = [...workerLangs].sort().join('+')

  // Reuse the worker if it's already loaded with the same languages
  if (workerInstance && currentLangKey === langKey) return workerInstance

  // Tear down old worker if langs changed
  if (workerInstance) {
    await workerInstance.terminate()
    workerInstance = null
  }

  const { createWorker } = await import('tesseract.js')

  // Cache language data in userData so it only downloads once
  const cacheDir = path.join(app.getPath('userData'), 'tessdata-cache')
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true })

  // Use forward slashes — tesseract.js has trouble with Windows backslashes in some versions
  const cacheDirFwd = cacheDir.replace(/\\/g, '/')

  try {
    workerInstance = await createWorker(langs, 1, {
      cachePath: cacheDirFwd,
      gzip: true,
      // We let tesseract.js use its default langPath which is usually better for the current version
      logger: (m) => {
        if (m.status === 'recognizing text') {
          // You could add progress logging here if needed
        }
      }
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

  // Notify progress at start
  onProgress?.(10)

  try {
    // Use an array for languages to be more robust in v7.
    // Note: In tesseract.js v7, putting 'eng' before 'chi_sim' prevents a potential 
    // initialization bug where the second language string is mangled.
    const worker = await getWorker(['eng', 'chi_sim'])

    onProgress?.(30)

    const result = await worker.recognize(imagePath, {}, {
      text: true // explicitly request text output for v7 performance
    })

    onProgress?.(100)

    return result.data.text.trim()
  } catch (err) {
    console.error('OCR Error:', err)
    throw new Error(`OCR failed: ${(err as Error).message}`)
  }
}

// Terminate the shared worker on app exit
export async function terminateOcrWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.terminate()
    workerInstance = null
    workerLangs = []
  }
}
