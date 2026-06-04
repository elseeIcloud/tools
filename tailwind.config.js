/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{vue,js,ts}',
    './app.vue',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f4f6fb',
          100: '#e6eaf5',
          200: '#c9d2e8',
          300: '#9fadd2',
          400: '#6b7bb0',
          500: '#475487',
          600: '#34406b',
          700: '#283256',
          800: '#1b2240',
          900: '#11162e',
          950: '#0b1020',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          soft: 'rgb(var(--accent) / <alpha-value>)',
          hover: 'rgb(var(--accent-hover) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'ui-sans-serif', 'sans-serif'],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,22,46,0.06), 0 8px 24px rgba(16,22,46,0.06)',
      },
    },
  },
  plugins: [],
}
