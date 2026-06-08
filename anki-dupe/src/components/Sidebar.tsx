import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import XpBar from './ui/XpBar'
import type { User } from '../types/db'

const navItems = [
  { to: '/dashboard',   label: 'Dashboard',       icon: '🏠' },
  { to: '/review',      label: 'Review',           icon: '🃏' },
  { to: '/vocabulary',  label: 'Vocabulary',       icon: '📚' },
  { to: '/import',      label: 'Import',           icon: '📥' },
  { to: '/statistics',  label: 'Statistics',       icon: '📊' },
  { to: '/graph',       label: 'Knowledge Graph',  icon: '🕸️' },
  { to: '/settings',    label: 'Settings',         icon: '⚙️' },
]

export default function Sidebar() {
  const [user, setUser] = useState<User | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    window.db.user.get().then(setUser).catch(() => null)
  }, [])

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-white/60 border-r border-surface-medium overflow-hidden">
      <nav className="flex-1 flex flex-col gap-1 p-3 overflow-y-auto pt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                'no-drag flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-sky-blue text-slate-700 shadow-soft'
                  : 'text-slate-500 hover:bg-surface-medium hover:text-slate-700',
              ].join(' ')
            }
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User XP footer */}
      <div className="p-4 border-t border-surface-medium bg-white/40">
        {user ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                🔥 <span className="font-semibold text-slate-600">{user.streak_days}</span> day streak
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
