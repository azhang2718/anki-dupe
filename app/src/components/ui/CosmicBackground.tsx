import { useMemo } from 'react'

/**
 * Full-bleed dreamy night-sky backdrop:
 * deep indigo→purple gradient, watercolor clouds, twinkling stars,
 * a crescent moon, and drifting blue nemophila-style flowers near the base.
 * Rendered fixed behind all app content. Purely decorative (aria-hidden).
 */

// Deterministic scattered stars
const STARS = Array.from({ length: 90 }, (_, i) => {
  const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1
  return {
    cx: r(1) * 100,
    cy: r(2) * 78,
    rad: 0.12 + r(3) * 0.5,
    op: 0.25 + r(4) * 0.6,
    dur: 2.4 + r(5) * 3.6,
    delay: r(6) * 4,
  }
})

// A few brighter 4-point sparkles
const SPARKLES = Array.from({ length: 10 }, (_, i) => {
  const r = (n: number) => ((Math.sin(i * 33.7 + n * 11.13) * 24634.21) % 1 + 1) % 1
  return { cx: 6 + r(1) * 88, cy: 4 + r(2) * 64, s: 0.7 + r(3) * 1.1, dur: 3 + r(4) * 3, delay: r(5) * 5 }
})

// Drifting blue flowers near the bottom (nemophila-style 5-petal blooms)
const FLOWERS = Array.from({ length: 16 }, (_, i) => {
  const r = (n: number) => ((Math.sin(i * 7.31 + n * 91.7) * 9123.91) % 1 + 1) % 1
  return {
    cx: r(1) * 100,
    cy: 70 + r(2) * 32,
    s: 0.9 + r(3) * 1.5,
    op: 0.16 + r(4) * 0.28,
    rot: r(5) * 360,
    dur: 6 + r(6) * 6,
    delay: r(7) * 5,
  }
})

function sparklePath(cx: number, cy: number, s: number): string {
  return `M${cx},${cy - s} Q${cx + s * 0.18},${cy - s * 0.18} ${cx + s},${cy}` +
    ` Q${cx + s * 0.18},${cy + s * 0.18} ${cx},${cy + s}` +
    ` Q${cx - s * 0.18},${cy + s * 0.18} ${cx - s},${cy}` +
    ` Q${cx - s * 0.18},${cy - s * 0.18} ${cx},${cy - s} Z`
}

function Flower({ cx, cy, s, op, rot }: { cx: number; cy: number; s: number; op: number; rot: number }) {
  const petals = [0, 72, 144, 216, 288]
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rot}) scale(${s})`} opacity={op}>
      {petals.map((a) => (
        <ellipse
          key={a}
          cx="0" cy="-1.15" rx="0.9" ry="1.25"
          fill="url(#cb-petal)"
          transform={`rotate(${a})`}
        />
      ))}
      <circle cx="0" cy="0" r="0.55" fill="#fef9e7" opacity="0.85" />
    </g>
  )
}

export default function CosmicBackground() {
  const stars = useMemo(() => STARS, [])
  const sparkles = useMemo(() => SPARKLES, [])
  const flowers = useMemo(() => FLOWERS, [])

  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <svg
        className="w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Base sky gradient: deep blue → indigo → purple */}
          <linearGradient id="cb-sky" x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0%"   stopColor="#0a0e2a" />
            <stop offset="38%"  stopColor="#141a45" />
            <stop offset="68%"  stopColor="#241a52" />
            <stop offset="100%" stopColor="#1a1340" />
          </linearGradient>

          {/* Warm dawn glow near horizon */}
          <radialGradient id="cb-glow" cx="42%" cy="64%" r="46%">
            <stop offset="0%"   stopColor="#6d5aa8" stopOpacity="0.42" />
            <stop offset="55%"  stopColor="#3a3a86" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          {/* Soft cloud body gradient */}
          <linearGradient id="cb-cloud" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#c6d2f5" />
            <stop offset="100%" stopColor="#5b6bb0" />
          </linearGradient>

          <radialGradient id="cb-petal" cx="50%" cy="35%" r="70%">
            <stop offset="0%"   stopColor="#cfe0ff" />
            <stop offset="100%" stopColor="#5f7adf" />
          </radialGradient>

          {/* Watercolor cloud texture */}
          <filter id="cb-water" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="3" seed="7" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="9" />
            <feGaussianBlur stdDeviation="0.6" />
          </filter>

          {/* Grain to break up gradient banding */}
          <filter id="cb-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="g" />
            <feColorMatrix in="g" type="matrix"
              values="0 0 0 0 0.6  0 0 0 0 0.65  0 0 0 0 0.9  0 0 0 0.5 0" />
          </filter>

          <filter id="cb-soft" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="0.8" />
          </filter>
        </defs>

        {/* ── Sky base ── */}
        <rect x="0" y="0" width="100" height="100" fill="url(#cb-sky)" />
        <rect x="0" y="0" width="100" height="100" fill="url(#cb-glow)" />

        {/* ── Stars ── */}
        {stars.map((s, i) => (
          <circle key={i} cx={s.cx} cy={s.cy} r={s.rad} fill="#eaf0ff">
            <animate attributeName="opacity"
              values={`${s.op};${s.op * 0.25};${s.op}`}
              dur={`${s.dur}s`} begin={`${s.delay}s`} repeatCount="indefinite" />
          </circle>
        ))}

        {/* ── Crescent moon (top-right) ── */}
        <g filter="url(#cb-soft)">
          <circle cx="80" cy="16" r="6.2" fill="#f3f0ff" opacity="0.9" />
          <circle cx="82.6" cy="14" r="5.4" fill="#141a45" />
          <circle cx="80" cy="16" r="6.2" fill="none" stroke="#fff7e6" strokeWidth="0.18" opacity="0.5" />
        </g>

        {/* ── Watercolor clouds ── */}
        <g filter="url(#cb-water)" opacity="0.5">
          <ellipse cx="22" cy="40" rx="20" ry="7"  fill="url(#cb-cloud)" opacity="0.45" />
          <ellipse cx="34" cy="36" rx="14" ry="5.5" fill="url(#cb-cloud)" opacity="0.4" />
          <ellipse cx="70" cy="52" rx="24" ry="8"  fill="url(#cb-cloud)" opacity="0.4" />
          <ellipse cx="84" cy="74" rx="22" ry="9"  fill="url(#cb-cloud)" opacity="0.5" />
          <ellipse cx="14" cy="82" rx="26" ry="11" fill="url(#cb-cloud)" opacity="0.5" />
          <ellipse cx="48" cy="90" rx="34" ry="12" fill="url(#cb-cloud)" opacity="0.55" />
          <ellipse cx="50" cy="60" rx="18" ry="6"  fill="url(#cb-cloud)" opacity="0.28" />
        </g>

        {/* ── Sparkles ── */}
        {sparkles.map((s, i) => (
          <path key={i} d={sparklePath(s.cx, s.cy, s.s)} fill="#fff7e0">
            <animate attributeName="opacity"
              values="0.15;0.95;0.15" dur={`${s.dur}s`} begin={`${s.delay}s`} repeatCount="indefinite" />
          </path>
        ))}

        {/* ── Drifting blue flowers near the base ── */}
        {flowers.map((f, i) => (
          <g key={i}>
            <animateTransform attributeName="transform" type="translate"
              values="0 0; 0.8 -1.2; 0 0" dur={`${f.dur}s`} begin={`${f.delay}s`}
              repeatCount="indefinite" additive="sum" />
            <Flower {...f} />
          </g>
        ))}

        {/* ── Fine grain overlay ── */}
        <rect x="0" y="0" width="100" height="100" filter="url(#cb-grain)" opacity="0.04" />
      </svg>
    </div>
  )
}
