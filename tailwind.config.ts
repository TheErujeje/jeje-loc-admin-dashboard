import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        stadium: { 900: '#0a0e1a', 800: '#0d1117', 700: '#1a1a2e' },
        pitch: { green: '#00ff87' },
        floodlight: { gold: '#ffd700', orange: '#f5a623' },
        electric: { cyan: '#04f5ff' },
      },
      fontFamily: {
        heading: ['var(--font-oswald)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
