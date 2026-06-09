import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  House, Cards, BookOpen, DownloadSimple,
  ChartBar, Trophy, Graph, Gear, Fire,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import XpBar from './ui/XpBar'
import type { User } from '../types/db'

const navItems: { to: string; label: string; Icon: Icon }[] = [
  { to: '/dashboard',    label: 'Dashboard',      Icon: House },
  { to: '/review',       label: 'Review',          Icon: Cards },
  { to: '/vocabulary',   label: 'Vocabulary',      Icon: BookOpen },
  { to: '/import',       label: 'Import',          Icon: DownloadSimple },
  { to: '/statistics',   label: 'Statistics',      Icon: ChartBar },
  { to: '/achievements', label: 'Achievements',    Icon: Trophy },
  { to: '/graph',        label: 'Knowledge Graph', Icon: Graph },
  { to: '/settings',     label: 'Settings',        Icon: Gear },
]

export default function Sidebar() {
  const [user, setUser] = useState<User | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    window.db.user.get().then(setUser).catch(() => null)
  }, [])

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

      {/* User XP footer */}
      <div className="p-4 border-t border-surface-medium bg-white/40">
        {user ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Fire size={13} weight="fill" className="text-orange-400" />
                <span className="font-semibold text-slate-600">{user.streak_days}</span> day streak
              </span>
              <button
                onClick={() => navigate('/review')}
                className="no-drag text-xs text-focus-blue font-medium hover:underline"
              >
                Study →
              </button>
            </div>
            <XpBar totalXp={user.total_xp} level={user.level} compact />
          </div>
        ) : (
          <div className="h-8 bg-surface-medium rounded-md animate-pulse" />
        )}
      </div>
    </aside>
  )
}
