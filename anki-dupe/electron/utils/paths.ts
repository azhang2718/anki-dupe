import { join } from 'path'

/** Resolve a built renderer HTML file (index.html, widget.html, …). */
export function rendererHtml(name: string): string {
  return join(__dirname, '../renderer', name)
}

/** Dev server URL for a renderer entry, when running `electron-vite dev`. */
export function rendererDevUrl(entry: string): string | undefined {
  const base = process.env['ELECTRON_RENDERER_URL']
  if (!base) return undefined
  return entry === 'index.html' ? base : `${base}/${entry}`
}
