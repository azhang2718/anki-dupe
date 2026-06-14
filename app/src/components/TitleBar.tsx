import { useState } from 'react'
import { Translate, AppWindow, PushPin } from '@phosphor-icons/react'

export default function TitleBar() {
  const [widgetOpen, setWidgetOpen] = useState(false)

  async function toggleWidget() {
    const isNowOpen = await window.electronAPI?.widget?.toggle()
    setWidgetOpen(!!isNowOpen)
  }

  return (
    <div className="drag-region h-9 flex items-center justify-between px-4 cosmic-panel border-b border-white/10 shrink-0">
      <div className="flex items-center gap-2">
        <Translate size={15} weight="fill" className="text-slate-400" />
        <span className="text-sm font-semibold text-slate-400 select-none">Anki Dupe</span>
      </div>
      <div className="no-drag flex items-center gap-3">
        <button
          onClick={toggleWidget}
          title={widgetOpen ? 'Close widget' : 'Open floating widget'}
          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
            widgetOpen
              ? 'bg-ice-blue text-slate-200'
              : 'bg-surface-medium text-slate-400 hover:bg-silver-blue'
          }`}
        >
          {widgetOpen
            ? <PushPin size={12} weight="fill" />
            : <AppWindow size={12} />
          }
          Widget
        </button>
        {/* macOS-style traffic lights */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => window.electronAPI?.window?.close()}
            className="w-3 h-3 rounded-full bg-error-pink/70 hover:bg-error-pink transition-colors"
            title="Close"
          />
          <button
            onClick={() => window.electronAPI?.window?.minimize()}
            className="w-3 h-3 rounded-full bg-xp-gold/70 hover:bg-xp-gold transition-colors"
            title="Minimize"
          />
          <button
            onClick={() => window.electronAPI?.window?.maximize()}
            className="w-3 h-3 rounded-full bg-success-mint/70 hover:bg-success-mint transition-colors"
            title="Maximize"
          />
        </div>
      </div>
    </div>
  )
}
