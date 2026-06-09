import { useEffect, useState } from 'react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { WifiSlash, WifiHigh } from '@phosphor-icons/react'
import { LANGUAGE_CONFIGS, LANGUAGE_CODES, type LanguageCode } from '../types/languages'

export default function SettingsPage() {
  const [apiKey, setApiKey]         = useState('')
  const [savedKey, setSavedKey]     = useState('')
  const [testing, setTesting]       = useState(false)
  const [testResult, setTestResult] = useState<'ok' | 'fail' | null>(null)
  const [saving, setSaving]         = useState(false)
  const [reviewLimit, setReviewLimit] = useState('50')
  const [offlineMode, setOfflineMode] = useState(false)
  const [activeLanguage, setActiveLanguage] = useState<LanguageCode>('chinese')
  const [loading, setLoading]       = useState(true)
  const [switchingLang, setSwitchingLang] = useState(false)

  useEffect(() => {
    Promise.all([
      window.db.settings.get('claude_api_key'),
      window.db.settings.get('review_limit'),
      window.db.settings.get('offline_mode'),
      window.db.language.get(),
    ]).then(([key, rl, offline, lang]) => {
      setApiKey(key ?? '')
      setSavedKey(key ?? '')
      setReviewLimit(rl ?? '50')
      setOfflineMode(offline === 'true')
      setActiveLanguage((lang ?? 'chinese') as LanguageCode)
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

  const saveReviewLimit = async () => {
    const n = parseInt(reviewLimit, 10)
    if (!isNaN(n) && n > 0) {
      await window.db.settings.set('review_limit', String(n))
    }
  }

  const toggleOfflineMode = async (val: boolean) => {
    setOfflineMode(val)
    await window.db.settings.set('offline_mode', val ? 'true' : 'false')
  }

  const handleLanguageSwitch = async (lang: LanguageCode) => {
    if (lang === activeLanguage) return
    setSwitchingLang(true)
    await window.db.language.set(lang)
    // Reload to reinitialize all state for the new language
    window.location.reload()
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
      if (!confirm('This will OVERWRITE all current data. Are you sure?')) return
      try {
        const reader = new FileReader()
        reader.onload = async (event) => {
          const data = JSON.parse(event.target?.result as string)
          await window.db.backup.importFull(data)
          alert('Data restored! The app will reload.')
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

  if (loading) return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-40 bg-surface-medium rounded" />
      <div className="h-32 bg-surface-medium rounded" />
    </div>
  )

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-700">Settings</h1>
        <p className="text-slate-400 mt-0.5 text-sm">Configure your experience</p>
      </div>

      {/* ── Language ───────────────────────────────────────────────────────── */}
      <Card>
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-0.5">Language</p>
            <p className="text-xs text-slate-400">
              Each language has its own separate vocabulary library, flashcard deck, and statistics.
              Switching reloads the app.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {LANGUAGE_CODES.map((lang) => {
              const cfg = LANGUAGE_CONFIGS[lang]
              const isActive = lang === activeLanguage
              return (
                <button
                  key={lang}
                  onClick={() => handleLanguageSwitch(lang)}
                  disabled={switchingLang}
                  className={`no-drag flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border-2 transition-all duration-150 ${
                    isActive
                      ? 'border-focus-blue bg-sky-blue shadow-soft'
                      : 'border-surface-medium bg-white hover:border-silver-blue hover:bg-surface-light'
                  }`}
                >
                  <span className="text-2xl">{cfg.flag}</span>
                  <span className={`text-xs font-semibold ${isActive ? 'text-slate-700' : 'text-slate-500'}`}>
                    {cfg.name}
                  </span>
                  <span className="text-[10px] text-slate-400">{cfg.nativeName}</span>
                  {isActive && (
                    <span className="text-[9px] font-bold text-focus-blue uppercase tracking-wide">Active</span>
                  )}
                </button>
              )
            })}
          </div>
          {switchingLang && (
            <p className="text-xs text-slate-400 text-center">Switching language, reloading…</p>
          )}
        </div>
      </Card>

      {/* ── Offline Mode ───────────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 p-2 rounded-md ${offlineMode ? 'bg-xp-gold/15' : 'bg-surface-light'}`}>
              {offlineMode
                ? <WifiSlash size={18} weight="fill" className="text-amber-500" />
                : <WifiHigh size={18} weight="fill" className="text-emerald-500" />
              }
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">
                Offline Mode
                {offlineMode && <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-xp-gold/20 text-amber-600">Active</span>}
              </p>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                When enabled, all Claude API features are disabled — vocab extraction, readiness analysis, and
                character recognition all run locally or are skipped.
                The app works fully offline: flashcards, FSRS scheduling, and imported documents continue to work.
              </p>
            </div>
          </div>
          <button
            onClick={() => toggleOfflineMode(!offlineMode)}
            className={`no-drag shrink-0 relative inline-flex h-6 w-11 rounded-full transition-colors duration-200 ${
              offlineMode ? 'bg-amber-400' : 'bg-surface-dark'
            }`}
          >
            <span
              style={{
                transform: offlineMode ? 'translateX(22px)' : 'translateX(2px)',
                display: 'inline-block', width: 20, height: 20, background: 'white',
                borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                marginTop: 2, transition: 'transform 0.2s',
              }}
            />
          </button>
        </div>
      </Card>

      {/* ── Claude API Key ────────────────────────────────────────────────── */}
      <Card className={offlineMode ? 'opacity-50 pointer-events-none' : ''}>
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-0.5">Claude API Key</p>
            <p className="text-xs text-slate-400">
              Required for vocabulary extraction and character recognition. Get yours at console.anthropic.com.
              {offlineMode && ' (Disabled in offline mode)'}
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); setTestResult(null) }}
              placeholder="sk-ant-api03-…"
              spellCheck={false}
              disabled={offlineMode}
              className="flex-1 px-3 py-2 rounded-md border border-surface-dark bg-surface-light text-slate-700 text-sm outline-none focus:border-ice-blue transition-colors font-mono disabled:opacity-50"
            />
            <Button onClick={saveApiKey} variant="secondary" size="sm" disabled={saving || !keyChanged || offlineMode}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button onClick={testKey} variant="ghost" size="sm" disabled={testing || !apiKey || offlineMode}>
              {testing ? 'Testing…' : 'Test'}
            </Button>
          </div>
          {testResult === 'ok' && <p className="text-xs text-emerald-600 font-medium">✓ API key is valid and working</p>}
          {testResult === 'fail' && <p className="text-xs text-rose-500">✗ API key invalid or request failed.</p>}
        </div>
      </Card>

      {/* ── Review Settings ───────────────────────────────────────────────── */}
      <Card>
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-0.5">Review Settings</p>
            <p className="text-xs text-slate-400">Daily card limit per session.</p>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-600 flex-1">Daily Review Limit</p>
            <input
              type="number"
              value={reviewLimit}
              min={1}
              onChange={(e) => setReviewLimit(e.target.value)}
              className="w-20 px-3 py-1.5 rounded-md border border-surface-dark bg-surface-light text-slate-700 text-sm outline-none focus:border-ice-blue text-center"
            />
            <Button onClick={saveReviewLimit} variant="secondary" size="sm">Save</Button>
          </div>
        </div>
      </Card>

      {/* ── Data Management ───────────────────────────────────────────────── */}
      <Card>
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-0.5">Data Management</p>
            <p className="text-xs text-slate-400">
              Backup or restore the active language's library, cards, and settings.
              Each language has its own backup.
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">Full Backup ({LANGUAGE_CONFIGS[activeLanguage].name})</p>
            <div className="flex gap-2">
              <Button onClick={importData} variant="ghost" size="sm">📤 Import JSON</Button>
              <Button onClick={exportData} variant="ghost" size="sm">📥 Export JSON</Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="pt-4 text-center">
        <p className="text-[11px] text-slate-300">Anki Dupe v0.1.0</p>
      </div>
    </div>
  )
}
