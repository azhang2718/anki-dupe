import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  House, Cards, BookOpen, DownloadSimple,
  ChartBar, PencilSimple, Gear, Fire,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { LANGUAGE_CONFIGS, type LanguageCode } from '../types/languages'

type NavItem = { to: string; label: string; Icon: Icon }

const navItems: NavItem[] = [
  { to: '/dashboard',  label: 'Dashboard',       Icon: House },
  { to: '/review',     label: 'Review',           Icon: Cards },
  { to: '/vocabulary', label: 'Vocabulary',       Icon: BookOpen },
  { to: '/import',     label: 'Import',           Icon: DownloadSimple },
  { to: '/statistics', label: 'Statistics',       Icon: ChartBar },
  { to: '/graph',      label: 'Draw & Identify',  Icon: PencilSimple },
  { to: '/settings',   label: 'Settings',         Icon: Gear },
]

export default function Sidebar() {
  const [streak, setStreak] = useState<number | null>(null)
  const [activeLang, setActiveLang] = useState<LanguageCode>('chinese')
  const navigate = useNavigate()

  useEffect(() => {
    window.db.user.get().then((u) => setStreak(u.streak_days)).catch(() => null)
    window.db.language.get().then((l) => setActiveLang((l ?? 'chinese') as LanguageCode)).catch(() => null)
  }, [])

  const langConfig = LANGUAGE_CONFIGS[activeLang]

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-white/60 border-r border-surface-medium overflow-hidden">
      <nav className="flex-1 flex flex-col gap-0.5 p-3 overflow-y-auto pt-4">
        {navItems.map(({ to, label, Icon: NavIcon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                'no-drag flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'bg-sky-blue text-slate-700 shadow-soft'
                  : 'text-slate-500 hover:bg-surface-medium hover:text-slate-700',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <NavIcon size={16} weight={isActive ? 'fill' : 'regular'} className="shrink-0" />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Language indicator */}
      <div
        className="mx-3 mb-2 px-3 py-2 rounded-md bg-surface-light border border-surface-medium cursor-pointer hover:bg-surface-medium transition-colors"
        onClick={() => navigate('/settings')}
        title="Click to change language"
      >
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{langConfig.flag}</span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-600 truncate">{langConfig.name}</p>
            <p className="text-[10px] text-slate-400">{langConfig.nativeName}</p>
          </div>
        </div>
      </div>

      {/* Streak footer */}
      {streak !== null && streak > 0 && (
        <div className="p-4 border-t border-surface-medium bg-white/40">
          <button
            onClick={() => navigate('/review')}
            className="no-drag w-full flex items-center justify-between text-xs"
          >
            <span className="flex items-center gap-1.5 text-slate-500">
              <Fire size={13} weight="fill" className="text-orange-400" />
              <span className="font-semibold text-slate-600">{streak}</span> day streak
            </span>
            <span className="text-focus-blue font-medium hover:underline">Study →</span>
          </button>
        </div>
      )}
    </aside>
  )
}
