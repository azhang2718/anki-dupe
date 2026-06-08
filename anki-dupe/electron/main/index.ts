import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { getDb, closeDb } from '../database/db'
import { registerDbHandlers } from '../ipc/dbHandlers'
import { registerWidgetHandlers } from '../ipc/widgetHandlers'
import { registerImportHandlers } from '../ipc/importHandlers'

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

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

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile(join(__dirname, '../../out/renderer/index.html'))
  }

  return win
}

app.whenReady().then(() => {
  // Initialize database first
  getDb()
  registerDbHandlers()
  registerWidgetHandlers()
  registerImportHandlers()
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  closeDb()
  if (process.platform !== 'darwin') app.quit()
})
