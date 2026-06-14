/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        'ice-blue': '#8B9CFF',
        'sky-blue': '#3A3A7A',
        'surface-light': '#0A0E2A',
        'surface-medium': '#1A1F45',
        'surface-dark': '#272C5E',
        'silver-blue': '#3C4380',
        'xp-gold': '#FFD866',
        'achievement-gold': '#FFC857',
        'success-mint': '#95F0C0',
        'focus-blue': '#A5B4FC',
        'error-pink': '#FFB6C1',
        'dream-purple': '#6D5AA8',
      },
      fontFamily: {
        sans: ['Geist', 'SF Pro Display', 'system-ui', 'sans-serif'],
        chinese: ['Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
      },
      borderRadius: {
        'sm': '10px',
        'md': '16px',
        'lg': '24px',
        'widget': '28px',
      },
      boxShadow: {
        // Tinted to the blue palette per taste-skills §4.4
        'soft':  '0 2px 12px rgba(124, 185, 255, 0.10), 0 1px 3px rgba(124, 185, 255, 0.06)',
        'float': '0 8px 32px rgba(124, 185, 255, 0.14), 0 2px 8px rgba(124, 185, 255, 0.08)',
        'modal': '0 20px 60px rgba(100, 150, 220, 0.16), 0 4px 16px rgba(100, 150, 220, 0.08)',
      },
      transitionTimingFunction: {
        // Emil Kowalski's custom easing curves
        'out-expo':  'cubic-bezier(0.23, 1, 0.32, 1)',
        'in-out-expo': 'cubic-bezier(0.77, 0, 0.175, 1)',
        'drawer':    'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      spacing: {
        '18': '72px',
      }
    },
  },
  plugins: [],
}
