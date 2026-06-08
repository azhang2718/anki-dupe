export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-semibold text-slate-700">Settings</h1>
        <p className="text-slate-400 mt-1 text-sm">Configure your experience.</p>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-soft flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-600">Claude API Key</label>
          <input
            type="password"
            placeholder="sk-ant-..."
            className="px-4 py-2 rounded-md border border-surface-dark bg-surface-light text-slate-700 text-sm outline-none focus:border-ice-blue transition-colors"
          />
          <p className="text-xs text-slate-400">
            Required for vocabulary extraction and analysis. Get yours at console.anthropic.com.
          </p>
        </div>
      </div>

      <p className="text-slate-300 text-xs">More settings coming in Phase 14</p>
    </div>
  )
}
