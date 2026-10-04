import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Palet Pangan & Bumi Lestari
        surface: {
          DEFAULT: '#FAF8F5', // Warm parchment background
          card: '#FFFFFF',
          muted: '#F4F0E8',
          border: '#E8E2D5',
        },
        brand: {
          DEFAULT: '#1E3A2F', // Deep Pine / Forest Emerald
          hover: '#152B23',
          light: '#2D5545',
          soft: '#EAF2ED',
          border: '#CBE0D3',
        },
        pine: {
          50: '#F2F7F4',
          100: '#E1EFE7',
          200: '#C5DFD2',
          300: '#9BC5B2',
          400: '#6AA68C',
          500: '#46886D',
          600: '#346D56',
          700: '#2A5745',
          800: '#1E3A2F', // Signature Pine
          900: '#172E25',
          950: '#0B1A14',
        },
        harvest: {
          DEFAULT: '#D97706',
          gold: '#D97706', // Emas Padi Panen
          amber: '#B45309',
          soft: '#FEF3C7',
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          500: '#D97706',
          600: '#B45309',
          700: '#92400E',
        },
        earth: {
          DEFAULT: '#8C5E38', // Cokelat Tanah Subur
          terracotta: '#C2410C',
          soft: '#F5EBE1',
        },
        status: {
          success: '#15803D',
          warning: '#B45309',
          danger: '#B91C1C',
          info: '#1D4ED8',
        },
      },
      borderRadius: {
        DEFAULT: '8px',
        card: '14px',
        badge: '6px',
      },
      boxShadow: {
        soft: '0 2px 10px -2px rgba(30, 58, 47, 0.05), 0 1px 3px -1px rgba(30, 58, 47, 0.03)',
        card: '0 4px 16px -4px rgba(30, 58, 47, 0.06), 0 2px 6px -2px rgba(30, 58, 47, 0.04)',
        elevated: '0 12px 32px -8px rgba(30, 58, 47, 0.12), 0 4px 12px -2px rgba(30, 58, 47, 0.04)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
