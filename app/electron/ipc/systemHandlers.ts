import { ipcMain } from 'electron'
import { log, getLogs } from '../utils/logger'

export function registerSystemHandlers(): void {
  ipcMain.handle('system:log', (_e, message: string, level: any) => {
    log(message, level)
  })

  ipcMain.handle('system:getLogs', () => {
    return { ok: true, data: getLogs() }
  })
}
