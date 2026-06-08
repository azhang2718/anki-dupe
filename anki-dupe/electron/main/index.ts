import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { getDb, closeDb, backupDatabase } from '../database/db'
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
  // Initialize logging
  rotateLogs()
  log('Application starting...')

  // Backup database
  backupDatabase()

  // Initialize database first
  getDb()
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
  if (process.platform !== 'darwin') app.quit()
})
