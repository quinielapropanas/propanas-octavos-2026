import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pp: {
          navy:     { DEFAULT: '#0C1E3F', deep: '#080C18' },
          maroon:   { DEFAULT: '#6B1D2A', light: '#8B2E3C' },
          gold:     { DEFAULT: '#C9A84C', light: '#E8D5A0', dim: '#9A7D30' },
          bg:       { DEFAULT: '#080C18', card: '#0E1528', surface: '#1A2340', hover: '#1E2E50' },
          border:   { DEFAULT: '#1C2744', light: '#253358' },
          text:     { DEFAULT: '#EDF0F7', secondary: '#A0AABF', muted: '#626E85' },
          success:  { DEFAULT: '#34D399', dim: '#065F46' },
          danger:   { DEFAULT: '#F87171', dim: '#7F1D1D' },
          warning:  { DEFAULT: '#FBBF24', dim: '#78350F' },
          info:     { DEFAULT: '#3B82F6', dim: '#1E3A5F' },
          rank:     { gold: '#FFD700', silver: '#C0C0C0', bronze: '#CD7F32' },
        },
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      borderRadius: { sm: '6px', md: '10px', lg: '14px', xl: '20px' },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.3)',
        hover: '0 4px 12px rgba(0,0,0,0.4)',
        gold: '0 0 12px rgba(201,168,76,0.3)',
        modal: '0 8px 30px rgba(0,0,0,0.5)',
      },
      spacing: { '18': '4.5rem', '22': '5.5rem' },
      animation: {
        'glow': 'glow 2s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': { filter: 'drop-shadow(0 0 8px rgba(201,168,76,0.25))' },
          '50%': { filter: 'drop-shadow(0 0 20px rgba(201,168,76,0.6))' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
