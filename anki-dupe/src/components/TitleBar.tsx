import { useState } from 'react'

export default function TitleBar() {
  const [widgetOpen, setWidgetOpen] = useState(false)

  async function toggleWidget() {
    const isNowOpen = await window.electronAPI?.widget?.toggle()
    setWidgetOpen(!!isNowOpen)
  }

  return (
    <div className="drag-region h-9 flex items-center justify-between px-4 bg-white/80 border-b border-surface-medium shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-base">🀄</span>
        <span className="text-sm font-semibold text-slate-500 select-none">Anki Dupe</span>
      </div>
      <div className="no-drag flex items-center gap-3">
        <button
          onClick={toggleWidget}
          title={widgetOpen ? 'Close widget' : 'Open floating widget'}
          className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
            widgetOpen
              ? 'bg-ice-blue text-slate-700'
              : 'bg-surface-medium text-slate-500 hover:bg-silver-blue'
          }`}
        >
          {widgetOpen ? '📌 Widget' : '🪟 Widget'}
        </button>
        {/* macOS-style window controls — functional ones come in Phase 14 */}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-error-pink/70 hover:bg-error-pink cursor-pointer" />
          <div className="w-3 h-3 rounded-full bg-xp-gold/70 hover:bg-xp-gold cursor-pointer" />
          <div className="w-3 h-3 rounded-full bg-success-mint/70 hover:bg-success-mint cursor-pointer" />
        </div>
      </div>
    </div>
  )
}
