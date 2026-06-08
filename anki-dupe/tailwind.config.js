/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        'ice-blue': '#A9D6FF',
        'sky-blue': '#D7EEFF',
        'surface-light': '#F8FBFF',
        'surface-medium': '#EEF4FA',
        'surface-dark': '#DDEAF5',
        'silver-blue': '#D4E1EE',
        'xp-gold': '#FFD866',
        'achievement-gold': '#FFC857',
        'success-mint': '#95F0C0',
        'focus-blue': '#7CB9FF',
        'error-pink': '#FFB6C1',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
        chinese: ['Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
      },
      borderRadius: {
        'sm': '12px',
        'md': '20px',
        'lg': '28px',
        'widget': '32px',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0,0,0,0.05)',
        'float': '0 12px 40px rgba(0,0,0,0.08)',
        'modal': '0 20px 60px rgba(0,0,0,0.12)',
      },
      spacing: {
        '18': '72px',
      }
    },
  },
  plugins: [],
}
