import { useEffect, useState } from 'react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

export default function SettingsPage() {
  const [apiKey, setApiKey]           = useState('')
  const [savedKey, setSavedKey]       = useState('')
  const [testing, setTesting]         = useState(false)
  const [testResult, setTestResult]   = useState<'ok' | 'fail' | null>(null)
  const [saving, setSaving]           = useState(false)
  const [dailyGoal, setDailyGoal]     = useState('50')
  const [theme, setTheme]             = useState('system')
  const [reviewLimit, setReviewLimit] = useState('50')
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    Promise.all([
      window.db.settings.get('claude_api_key'),
      window.db.settings.get('daily_xp_goal'),
      window.db.settings.get('theme'),
      window.db.settings.get('review_limit'),
    ]).then(([key, goal, t, rl]) => {
      setApiKey(key ?? '')
      setSavedKey(key ?? '')
      setDailyGoal(goal ?? '50')
      setTheme(t ?? 'system')
      setReviewLimit(rl ?? '50')
      setLoading(false)
    })
  }, [])

  const saveApiKey = async () => {
    setSaving(true)
    setTestResult(null)
    await window.db.settings.set('claude_api_key', apiKey.trim())
    setSavedKey(apiKey.trim())
    setSaving(false)
  }

  const testKey = async () => {
    if (apiKey !== savedKey) await saveApiKey()
    setTesting(true)
    setTestResult(null)
    const result = await window.claudeAPI.testKey()
    setTestResult(result.data ? 'ok' : 'fail')
    setTesting(false)
  }

  const saveDailyGoal = async () => {
    const n = parseInt(dailyGoal, 10)
    if (!isNaN(n) && n > 0) {
      await window.db.settings.set('daily_xp_goal', String(n))
      await window.db.user.updateDailyGoal(n)
      alert('Daily goal saved!')
    }
  }

  const saveTheme = async (val: string) => {
    setTheme(val)
    await window.db.settings.set('theme', val)
  }

  const saveReviewLimit = async () => {
    const n = parseInt(reviewLimit, 10)
    if (!isNaN(n) && n > 0) {
      await window.db.settings.set('review_limit', String(n))
      alert('Review limit saved!')
    }
  }

  const exportData = async () => {
    try {
      const data = await window.db.backup.exportFull()
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `anki-dupe-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
    } catch (err) {
      alert('Export failed: ' + (err as Error).message)
    }
  }

  const importData = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0]
      if (!file) return
      
      if (!confirm('This will OVERWRITE all current data. Are you sure you want to proceed?')) return

      try {
        const reader = new FileReader()
        reader.onload = async (event) => {
          const content = event.target?.result as string
          const data = JSON.parse(content)
          await window.db.backup.importFull(data)
          alert('Data restored successfully! The app will now reload.')
          window.location.reload()
        }
        reader.readAsText(file)
      } catch (err) {
        alert('Import failed: ' + (err as Error).message)
      }
    }
    input.click()
  }

  const keyChanged = apiKey !== savedKey

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 w-40 bg-surface-medium rounded" /><div className="h-32 bg-surface-medium rounded" /></div>

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-700">Settings</h1>
        <p className="text-slate-400 mt-0.5 text-sm">Configure your experience</p>
      </div>

      {/* Claude API Key */}
      <Card>
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-0.5">Claude API Key</p>
            <p className="text-xs text-slate-400">
              Required for vocabulary extraction. Get yours at console.anthropic.com.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); setTestResult(null) }}
              placeholder="sk-ant-api03-…"
              spellCheck={false}
              className="flex-1 px-3 py-2 rounded-md border border-surface-dark bg-surface-light text-slate-700 text-sm outline-none focus:border-ice-blue transition-colors font-mono"
            />
            <Button
              onClick={saveApiKey}
              variant="secondary"
              size="sm"
              disabled={saving || !keyChanged}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button
              onClick={testKey}
              variant="ghost"
              size="sm"
              disabled={testing || !apiKey}
            >
              {testing ? 'Testing…' : 'Test'}
            </Button>
          </div>

          {testResult === 'ok' && (
            <p className="text-xs text-emerald-600 font-medium">✓ API key is valid and working</p>
          )}
          {testResult === 'fail' && (
            <p className="text-xs text-rose-500">✗ API key invalid or request failed. Check the key and try again.</p>
          )}
        </div>
      </Card>

      {/* Daily XP Goal */}
      <Card>
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-0.5">Daily XP Goal</p>
            <p className="text-xs text-slate-400">
              How much XP you want to earn each day.
            </p>
          </div>
          <div className="flex gap-3 items-center">
            {[25, 50, 100, 200].map((preset) => (
              <button
                key={preset}
                onClick={() => setDailyGoal(String(preset))}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  dailyGoal === String(preset)
                    ? 'bg-sky-blue text-slate-700'
                    : 'bg-surface-medium text-slate-500 hover:bg-surface-dark'
                }`}
              >
                {preset}
              </button>
            ))}
            <input
              type="number"
              value={dailyGoal}
              min={1}
              onChange={(e) => setDailyGoal(e.target.value)}
              className="w-20 px-3 py-1.5 rounded-md border border-surface-dark bg-surface-light text-slate-700 text-sm outline-none focus:border-ice-blue text-center"
            />
            <Button onClick={saveDailyGoal} variant="secondary" size="sm">
              Save
            </Button>
          </div>
        </div>
      </Card>

      {/* Review Settings */}
      <Card>
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-0.5">Review Settings</p>
            <p className="text-xs text-slate-400">
              Control your study session limits.
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">Daily Review Limit</p>
            <div className="flex gap-3 items-center">
              <input
                type="number"
                value={reviewLimit}
                min={1}
                onChange={(e) => setReviewLimit(e.target.value)}
                className="w-20 px-3 py-1.5 rounded-md border border-surface-dark bg-surface-light text-slate-700 text-sm outline-none focus:border-ice-blue text-center"
              />
              <Button onClick={saveReviewLimit} variant="secondary" size="sm">
                Save
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Appearance */}
      <Card>
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-0.5">Appearance</p>
            <p className="text-xs text-slate-400">
              Choose your interface style.
            </p>
          </div>
          <div className="flex gap-2">
            {['light', 'dark', 'system'].map((t) => (
              <button
                key={t}
                onClick={() => saveTheme(t)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                  theme === t ? 'bg-ice-blue text-slate-700' : 'bg-surface-medium text-slate-500 hover:bg-silver-blue'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Data Management */}
      <Card>
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-0.5">Data Management</p>
            <p className="text-xs text-slate-400">
              Backup or restore your entire library, cards, and settings.
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">Full Backup</p>
            <div className="flex gap-2">
              <Button onClick={importData} variant="ghost" size="sm">
                📤 Import JSON
              </Button>
              <Button onClick={exportData} variant="ghost" size="sm">
                📥 Export JSON
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* About */}
      <div className="pt-4 text-center">
        <p className="text-[11px] text-slate-300">Anki Dupe v0.1.0 • Polish Pass Complete</p>
      </div>
    </div>
  )
}
