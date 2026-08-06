import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // FPL-inspired brand accents
        brand: {
          blue: '#0EA5E9',
          'blue-light': '#E0F7FF',
          purple: '#38003C',
          'purple-light': '#F3E8F5',
          lilac: '#D499B9',
          evergreen: '#053225',
        },
        // Warm grayscale text/border scale
        ink: {
          100: '#FAFAFA', 200: '#F0F0F0', 300: '#E0E0E0', 400: '#BDBDBD', 500: '#8C8C8C',
          600: '#5C5C5C', 700: '#3A3A3A', 800: '#1F1F1F', 900: '#0F0F12',
        },
        surface: '#FFFFFF',
        hairline: '#ECECEC',
        status: { success: '#16A34A', warning: '#D97706', danger: '#DC2626', pending: '#6B7280' },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
      },
    },
  },
  plugins: [],
}
export default config
