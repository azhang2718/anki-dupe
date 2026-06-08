import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { Achievement } from '../types/db'

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([])

  useEffect(() => {
    window.db.achievements.getAll().then(setAchievements)
  }, [])

  const unlocked = achievements.filter((a) => a.unlocked_at)
  const locked   = achievements.filter((a) => !a.unlocked_at)

  return (
    <motion.div
      className="flex flex-col gap-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <h1 className="text-2xl font-semibold text-slate-700">Achievements</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {unlocked.length} / {achievements.length} unlocked
        </p>
      </div>

      {unlocked.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Unlocked</h2>
          <div className="grid grid-cols-2 gap-3">
            {unlocked.map((a) => (
              <AchievementCard key={a.key} achievement={a} unlocked />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Locked</h2>
        <div className="grid grid-cols-2 gap-3">
          {locked.map((a) => (
            <AchievementCard key={a.key} achievement={a} unlocked={false} />
          ))}
        </div>
      </section>
    </motion.div>
  )
}

function AchievementCard({ achievement: a, unlocked }: { achievement: Achievement; unlocked: boolean }) {
  return (
    <motion.div
      layout
      className={`rounded-lg p-4 flex items-start gap-3 shadow-soft transition-colors ${
        unlocked ? 'bg-white border border-xp-gold/20' : 'bg-surface-light opacity-50'
      }`}
    >
      <span className={`text-2xl mt-0.5 ${unlocked ? '' : 'grayscale'}`}>{a.icon}</span>
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="text-sm font-semibold text-slate-700 truncate">{a.name}</p>
        <p className="text-xs text-slate-400 leading-snug">{a.description}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-semibold text-amber-500">+{a.xp_reward} XP</span>
          {unlocked && a.unlocked_at && (
            <span className="text-[10px] text-slate-300">
              {new Date(a.unlocked_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
