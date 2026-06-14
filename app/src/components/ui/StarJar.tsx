import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface StarJarProps {
  count: number   // cards reviewed today (toward goal)
  goal: number    // daily goal (e.g. 100)
}

// Fixed star positions inside the jar interior (viewBox 0 0 100 175)
// Jar interior: x 13–87, y 24–156
const STAR_SLOTS = [
  { x: 33, y: 132, s: 4.5 }, { x: 55, y: 137, s: 3.5 }, { x: 72, y: 130, s: 4.0 },
  { x: 44, y: 122, s: 3.0 }, { x: 65, y: 119, s: 3.5 },
  { x: 27, y: 110, s: 3.5 }, { x: 50, y: 114, s: 4.0 }, { x: 70, y: 107, s: 3.0 },
  { x: 38, y: 100, s: 4.5 }, { x: 62, y: 97,  s: 3.5 },
  { x: 24, y: 86,  s: 3.0 }, { x: 48, y: 90,  s: 4.0 }, { x: 74, y: 84,  s: 3.5 },
  { x: 36, y: 76,  s: 4.5 }, { x: 60, y: 73,  s: 3.0 },
  { x: 26, y: 63,  s: 3.5 }, { x: 52, y: 60,  s: 4.0 }, { x: 75, y: 67,  s: 3.0 },
  { x: 40, y: 52,  s: 3.5 }, { x: 65, y: 50,  s: 4.5 },
  { x: 30, y: 42,  s: 3.0 }, { x: 54, y: 38,  s: 4.0 }, { x: 74, y: 44,  s: 3.5 },
  { x: 42, y: 30,  s: 4.0 }, { x: 66, y: 28,  s: 3.0 },
]

function star5(cx: number, cy: number, r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2
    const rad = i % 2 === 0 ? r : r * 0.38
    pts.push(`${(cx + Math.cos(a) * rad).toFixed(2)},${(cy + Math.sin(a) * rad).toFixed(2)}`)
  }
  return `M${pts.join('L')}Z`
}

const BG_DOTS = Array.from({ length: 30 }, (_, i) => ({
  cx: 16 + ((i * 43 + 7) % 68),
  cy: 28 + ((i * 61 + 11) % 122),
  r:  0.35 + (i % 4) * 0.18,
  op: 0.18 + (i % 6) * 0.06,
}))

const FULL_SPARKLES = [
  { x: 6,  y: 44,  r: 2.8, d: 0.0 },
  { x: 94, y: 62,  r: 2.2, d: 0.5 },
  { x: 50, y: 4,   r: 3.2, d: 0.9 },
  { x: 8,  y: 112, r: 2.0, d: 1.4 },
  { x: 92, y: 128, r: 2.5, d: 1.8 },
]

export default function StarJar({ count, goal }: StarJarProps) {
  const pct = Math.min(1, Math.max(0, count / goal))
  const visible = Math.round(pct * STAR_SLOTS.length)
  // y of liquid surface: 157 (empty) → 25 (full)
  const fillY = 157 - pct * 132
  const isFull = pct >= 1
  const isGlowing = pct > 0

  const glowColor = isFull ? '251,191,36' : '96,165,250'
  const glowOpacity = 0.18 + pct * 0.4

  const bgDots = useMemo(() => BG_DOTS, [])

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <svg
        viewBox="0 0 100 175"
        className="w-36 h-auto"
        style={isGlowing ? { filter: `drop-shadow(0 0 ${10 + pct * 18}px rgba(${glowColor},${glowOpacity}))` } : undefined}
      >
        <defs>
          {/* Interior clip */}
          <clipPath id="sjc-jar">
            <rect x="13" y="24" width="74" height="133" rx="6" />
          </clipPath>

          {/* Cosmic sky gradient */}
          <radialGradient id="sjc-sky" cx="45%" cy="68%" r="72%">
            <stop offset="0%"   stopColor="#13206b" />
            <stop offset="50%"  stopColor="#06103a" />
            <stop offset="100%" stopColor="#020818" />
          </radialGradient>

          {/* Rising fill glow */}
          <radialGradient id="sjc-fillglow" cx="50%" cy="100%" r="80%">
            <stop offset="0%"   stopColor={isFull ? '#b45309' : '#1d4ed8'} stopOpacity="0.55" />
            <stop offset="100%" stopColor={isFull ? '#451a03' : '#0f172a'} stopOpacity="0.05" />
          </radialGradient>

          {/* Star glow filter */}
          <filter id="sjc-starglow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Sparkle filter */}
          <filter id="sjc-sparkglow" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Glass sheen (left edge highlight) */}
          <linearGradient id="sjc-sheen" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="white" stopOpacity="0.13" />
            <stop offset="28%"  stopColor="white" stopOpacity="0.05" />
            <stop offset="100%" stopColor="white" stopOpacity="0.0"  />
          </linearGradient>

          {/* Lid gradient */}
          <linearGradient id="sjc-lid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#2a3244" />
            <stop offset="100%" stopColor="#161d2e" />
          </linearGradient>
        </defs>

        {/* ── Ambient outer halo ── */}
        {isGlowing && (
          <motion.ellipse
            cx="50" cy="90"
            initial={false}
            animate={{ rx: 36 + pct * 12, ry: 70 + pct * 20, opacity: pct * 0.14 }}
            transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
            fill="none"
            stroke={isFull ? '#fbbf24' : '#3b82f6'}
            strokeWidth="14"
            style={{ filter: 'blur(10px)' }}
          />
        )}

        {/* ── Jar body — deep space ── */}
        <rect x="13" y="24" width="74" height="133" rx="6" fill="url(#sjc-sky)" />

        {/* Tiny background star-dust dots */}
        {bgDots.map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill="white" opacity={d.op} clipPath="url(#sjc-jar)" />
        ))}

        {/* ── Rising fill ── */}
        {pct > 0 && (
          <>
            {/* Diffuse glow beneath fill surface */}
            <rect x="13" y="24" width="74" height="133" rx="6"
              fill="url(#sjc-fillglow)" clipPath="url(#sjc-jar)" />
            {/* Liquid fill body */}
            <motion.rect
              x="13" width="74" rx="0"
              fill={isFull ? 'rgba(245,158,11,0.13)' : 'rgba(37,99,235,0.22)'}
              clipPath="url(#sjc-jar)"
              initial={false}
              animate={{ y: fillY, height: 157 - fillY }}
              transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
            />
            {/* Surface shimmer line */}
            <motion.ellipse
              cx="50" rx="34" ry="2.2"
              fill="none"
              stroke={isFull ? 'rgba(251,191,36,0.55)' : 'rgba(147,197,253,0.42)'}
              strokeWidth="1.1"
              clipPath="url(#sjc-jar)"
              initial={false}
              animate={{ cy: fillY }}
              transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
            />
          </>
        )}

        {/* ── Gold stars ── */}
        <AnimatePresence>
          {STAR_SLOTS.slice(0, visible).map((s, i) => (
            <motion.g
              key={`star-${i}`}
              clipPath="url(#sjc-jar)"
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
            >
              {/* Soft glow beneath star */}
              <ellipse
                cx={s.x} cy={s.y + 1}
                rx={s.s * 1.5} ry={s.s * 0.9}
                fill={isFull ? '#f59e0b' : '#fde68a'}
                opacity={0.28}
                style={{ filter: 'blur(2px)' }}
              />
              <path
                d={star5(s.x, s.y, s.s)}
                fill={isFull ? '#fbbf24' : '#fde68a'}
                filter="url(#sjc-starglow)"
              />
            </motion.g>
          ))}
        </AnimatePresence>

        {/* ── Shooting star trails (appear as jar fills) ── */}
        {pct > 0.2 && (
          <g clipPath="url(#sjc-jar)">
            <motion.line x1="73" y1="50" x2="85" y2="40"
              stroke="#fde68a" strokeWidth="0.7" strokeLinecap="round"
              animate={{ opacity: [0, 0.75, 0] }}
              transition={{ duration: 1.9, repeat: Infinity, delay: 0.7 }} />
            <motion.line x1="23" y1="72" x2="13" y2="63"
              stroke="#fde68a" strokeWidth="0.55" strokeLinecap="round"
              animate={{ opacity: [0, 0.55, 0] }}
              transition={{ duration: 2.3, repeat: Infinity, delay: 2.1 }} />
            {pct > 0.5 && (
              <motion.line x1="68" y1="96" x2="80" y2="85"
                stroke="#fde68a" strokeWidth="0.65" strokeLinecap="round"
                animate={{ opacity: [0, 0.65, 0] }}
                transition={{ duration: 2.0, repeat: Infinity, delay: 3.5 }} />
            )}
          </g>
        )}

        {/* ── Crescent moon (appears at 40% fill) ── */}
        {pct >= 0.4 && (
          <motion.g
            clipPath="url(#sjc-jar)"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 0.65, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          >
            {/* Crescent: large circle minus offset circle */}
            <circle cx="28" cy="58" r="7" fill="#c4d9f8" opacity="0.7" />
            <circle cx="31" cy="55" r="5.8" fill="#06103a" />
          </motion.g>
        )}

        {/* ── Glass sheen & outline ── */}
        <rect x="13" y="24" width="74" height="133" rx="6" fill="url(#sjc-sheen)" />
        <rect x="13" y="24" width="74" height="133" rx="6"
          fill="none" stroke="rgba(255,255,255,0.17)" strokeWidth="1.2" />
        {/* Right-edge subtle glint */}
        <line x1="86" y1="32" x2="86" y2="150"
          stroke="rgba(255,255,255,0.05)" strokeWidth="2" clipPath="url(#sjc-jar)" />

        {/* ── Lid ── */}
        <rect x="20" y="14" width="60" height="13" rx="3" fill="url(#sjc-lid)" />
        <rect x="20" y="14" width="60" height="13" rx="3"
          fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="0.9" />
        {/* Gold wire latch */}
        <line x1="22" y1="14" x2="78" y2="14" stroke="rgba(212,160,23,0.85)" strokeWidth="1.3" />
        <circle cx="22" cy="14" r="2.2" fill="#c89a14" />
        <circle cx="78" cy="14" r="2.2" fill="#c89a14" />
        {/* Bail wire arc */}
        <path d="M34,14 Q50,5.5 66,14"
          fill="none" stroke="rgba(200,154,20,0.75)" strokeWidth="1.3" />

        {/* ── External sparkles when full ── */}
        {isFull && FULL_SPARKLES.map((sp, i) => (
          <motion.path
            key={`sp-${i}`}
            d={star5(sp.x, sp.y, sp.r)}
            fill="#fbbf24"
            filter="url(#sjc-sparkglow)"
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            animate={{ opacity: [0.15, 1, 0.15], scale: [0.6, 1.4, 0.6] }}
            transition={{ duration: 2.2 + i * 0.25, repeat: Infinity, ease: 'easeInOut', delay: sp.d }}
          />
        ))}
      </svg>

      {/* Progress label */}
      <div className="text-center">
        <p className="text-sm font-semibold tabular-nums" style={{ color: isFull ? '#fbbf24' : 'rgb(148,163,184)' }}>
          {count} <span className="text-slate-500 font-normal">/ {goal}</span>
        </p>
        <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
          {isFull ? '✨ Goal reached!' : 'cards today'}
        </p>
      </div>
    </div>
  )
}
