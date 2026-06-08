import { ipcMain, BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { rendererDevUrl, rendererHtml } from '../utils/paths'

let widgetWin: BrowserWindow | null = null

export function createWidgetWindow(): BrowserWindow {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize

  widgetWin = new BrowserWindow({
    width: 280,
    height: 420,
    minWidth: 240,
    minHeight: 360,
    maxWidth: 600,
    maxHeight: 800,
    x: sw - 300,
    y: sh - 460,
    frame: false,
    transparent: true,
    resizable: true,
    alwaysOnTop: false,
    skipTaskbar: true,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  widgetWin.once('ready-to-show', () => widgetWin?.show())

  widgetWin.on('closed', () => {
    widgetWin = null
  })

  const devUrl = rendererDevUrl('widget.html')
  if (devUrl) {
    widgetWin.loadURL(devUrl)
  } else {
    widgetWin.loadFile(rendererHtml('widget.html'))
  }

  return widgetWin
}

export function registerWidgetHandlers(): void {
  ipcMain.handle('widget:toggle', () => {
    if (widgetWin && !widgetWin.isDestroyed()) {
      widgetWin.close()
      widgetWin = null
      return false
    }
    createWidgetWindow()
    return true
  })

  ipcMain.handle('widget:setAlwaysOnTop', (_e, value: boolean) => {
    widgetWin?.setAlwaysOnTop(value, 'floating')
  })

  ipcMain.handle('widget:setExpanded', (_e, expanded: boolean) => {
    if (!widgetWin || widgetWin.isDestroyed()) return
    const [x, y] = widgetWin.getPosition()
    if (expanded) {
      widgetWin.setSize(600, 800, true)
    } else {
      widgetWin.setSize(280, 420, true)
    }
    widgetWin.setPosition(x, y)
  })

  ipcMain.handle('widget:isOpen', () => {
    return !!(widgetWin && !widgetWin.isDestroyed())
  })
}
