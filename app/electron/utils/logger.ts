import { app } from 'electron'
import path from 'path'
import fs from 'fs'

const LOG_FILE = 'anki-dupe.log'
const MAX_LOGS = 5

export function getLogPath(): string {
  return path.join(app.getPath('userData'), LOG_FILE)
}

export function rotateLogs(): void {
  const logPath = getLogPath()
  if (!fs.existsSync(logPath)) return

  // Simple rotation: if log file is > 1MB, move it
  const stats = fs.statSync(logPath)
  if (stats.size < 1024 * 1024) return

  for (let i = MAX_LOGS - 1; i >= 1; i--) {
    const oldPath = `${logPath}.${i}`
    const newPath = `${logPath}.${i + 1}`
    if (fs.existsSync(oldPath)) fs.renameSync(oldPath, newPath)
  }
  fs.renameSync(logPath, `${logPath}.1`)
}

export function log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
  const timestamp = new Date().toISOString()
  const line = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`
  
  try {
    fs.appendFileSync(getLogPath(), line)
    if (process.env.NODE_ENV === 'development') {
      console.log(line.trim())
    }
  } catch (err) {
    console.error('Failed to write log:', err)
  }
}

export function getLogs(): string {
  try {
    if (!fs.existsSync(getLogPath())) return ''
    return fs.readFileSync(getLogPath(), 'utf-8')
  } catch {
    return 'Failed to read logs'
  }
}
