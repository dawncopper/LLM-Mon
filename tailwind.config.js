/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1a1a2e',
        background: '#16213e',
        accent: '#0f3460',
        'mint-green': '#00d9a5',
        'sky-blue': '#4facfe',
        'amber-orange': '#ffa500',
        'error-red': '#ff6b6b',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Noto Sans SC', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
