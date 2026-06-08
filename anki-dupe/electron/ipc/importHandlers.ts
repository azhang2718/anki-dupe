import { ipcMain, dialog, BrowserWindow } from 'electron'
import fs from 'fs'
import path from 'path'
import { documentRepository } from '../database/repositories/documentRepository'
import { checkAchievements } from '../services/achievementChecker'

const SUPPORTED_EXTENSIONS: Record<string, string> = {
  '.png':  'image',
  '.jpg':  'image',
  '.jpeg': 'image',
  '.webp': 'image',
  '.pdf':  'pdf',
  '.txt':  'txt',
  '.srt':  'srt',
  '.docx': 'docx',
}

function walkDir(dir: string): string[] {
  const results: string[] = []
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return results
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...walkDir(full))
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase()
      if (SUPPORTED_EXTENSIONS[ext]) results.push(full)
    }
  }
  return results
}

function resolveFilePaths(inputPaths: string[]): string[] {
  const files: string[] = []
  for (const p of inputPaths) {
    try {
      const stat = fs.statSync(p)
      if (stat.isDirectory()) {
        files.push(...walkDir(p))
      } else {
        const ext = path.extname(p).toLowerCase()
        if (SUPPORTED_EXTENSIONS[ext]) files.push(p)
      }
    } catch {
      // skip unreadable paths
    }
  }
  return files
}

function readTextFile(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8')
  } catch {
    return ''
  }
}

export function registerImportHandlers(): void {
  // Open native file/folder picker dialog
  ipcMain.handle('import:dialog', async (_event, type: 'files' | 'folder') => {
    const win = BrowserWindow.getFocusedWindow()
    const properties: ('openFile' | 'openDirectory' | 'multiSelections')[] =
      type === 'folder' ? ['openDirectory'] : ['openFile', 'multiSelections']

    const result = await dialog.showOpenDialog(win!, {
      properties,
      filters: type === 'files' ? [
        { name: 'Supported Files', extensions: ['png','jpg','jpeg','webp','pdf','txt','srt','docx'] },
        { name: 'Images', extensions: ['png','jpg','jpeg','webp'] },
        { name: 'Documents', extensions: ['pdf','txt','srt','docx'] },
        { name: 'All Files', extensions: ['*'] },
      ] : [],
    })

    if (result.canceled || !result.filePaths.length) return { ok: true, data: [] }

    return processImport(result.filePaths)
  })

  // Import from an array of paths (used for drag-drop from renderer)
  ipcMain.handle('import:files', (_event, paths: string[]) => {
    return processImport(paths)
  })
}

function processImport(inputPaths: string[]): { ok: boolean; data?: unknown; error?: string } {
  try {
    const filePaths = resolveFilePaths(inputPaths)
    const imported = []

    for (const filePath of filePaths) {
      const ext = path.extname(filePath).toLowerCase()
      const sourceType = SUPPORTED_EXTENSIONS[ext] as 'image' | 'pdf' | 'txt' | 'srt' | 'docx'
      const title = path.basename(filePath)

      // Skip if already imported (same file_path)
      const existing = documentRepository.getAll().find((d) => d.file_path === filePath)
      if (existing) {
        imported.push(existing)
        continue
      }

      // For plain-text formats, read content immediately
      const isTextReadable = sourceType === 'txt' || sourceType === 'srt'
      const rawText = isTextReadable ? readTextFile(filePath) : null
      const status = isTextReadable && rawText ? 'done' : 'pending'

      const doc = documentRepository.create({
        title,
        source_type: sourceType,
        file_path: filePath,
        raw_text: rawText,
        word_count: 0,
        known_word_count: 0,
        comprehension_score: 0,
        processing_status: status as 'pending' | 'done',
      })
      imported.push(doc)
    }

    // Trigger first_import achievement check
    if (imported.length > 0) {
      checkAchievements({})
    }

    return { ok: true, data: imported }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}
