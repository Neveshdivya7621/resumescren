/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        surface: {
          DEFAULT: '#0f1117',
          card:    '#1a1d27',
          border:  '#2a2d3e',
          hover:   '#22253a',
        },
      },
      backgroundImage: {
        'grid-pattern':
          "linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)",
        'brand-gradient':
          'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
      },
      backgroundSize: {
        'grid-40': '40px 40px',
      },
      animation: {
        'fade-in':   'fadeIn 0.5s ease-out forwards',
        'slide-up':  'slideUp 0.4s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer':   'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'brand-sm': '0 0 0 1px rgba(99,102,241,0.3)',
        'brand-md': '0 0 20px rgba(99,102,241,0.2)',
        'brand-lg': '0 0 40px rgba(99,102,241,0.3)',
        'card':     '0 4px 24px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}
