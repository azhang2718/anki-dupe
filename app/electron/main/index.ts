import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { getSettingsDb, closeSettingsDb } from '../database/settingsDb'
import { getDb, closeDb, backupDatabase, initActiveLanguage } from '../database/db'
import { registerDbHandlers } from '../ipc/dbHandlers'
import { registerWidgetHandlers } from '../ipc/widgetHandlers'
import { registerImportHandlers } from '../ipc/importHandlers'
import { registerOcrHandlers } from '../ipc/ocrHandlers'
import { registerClaudeHandlers } from '../ipc/claudeHandlers'
import { registerWindowHandlers } from '../ipc/windowHandlers'
import { registerSystemHandlers } from '../ipc/systemHandlers'
import { log, rotateLogs } from '../utils/logger'
import { rendererDevUrl, rendererHtml } from '../utils/paths'

function loadRenderer(win: BrowserWindow, entry: string): void {
  const devUrl = rendererDevUrl(entry)
  if (devUrl) {
    win.loadURL(devUrl)
    if (entry === 'index.html') win.webContents.openDevTools()
  } else {
    win.loadFile(rendererHtml(entry))
  }
}

function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    title: 'Anki Dupe',
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#F8FBFF',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.once('ready-to-show', () => win.show())

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  loadRenderer(win, 'index.html')

  return win
}

app.whenReady().then(() => {
  rotateLogs()
  log('Application starting...')

  // 1. Open global settings DB first (needed to determine active language)
  getSettingsDb()

  // 2. Read and apply active language before opening any language DB
  initActiveLanguage()

  // 3. Backup the active language DB (non-fatal)
  try { backupDatabase() } catch { /* ignore */ }

  // 4. Open the active language DB
  getDb()

  // 5. Register IPC handlers
  registerDbHandlers()
  registerWidgetHandlers()
  registerImportHandlers()
  registerOcrHandlers()
  registerClaudeHandlers()
  registerWindowHandlers()
  registerSystemHandlers()

  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', async () => {
  log('Application closing...')
  const { terminateOcrWorker } = await import('../services/ocrService')
  await terminateOcrWorker().catch(() => {})
  closeDb()
  closeSettingsDb()
  if (process.platform !== 'darwin') app.quit()
})
