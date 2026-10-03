import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2F6B3F', // Hijau daun utama
          hover: '#255534',
          soft: '#E8F2EA',
        },
        accent: {
          DEFAULT: '#D98E04', // Kuning padi
          soft: '#FDF3DC',
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
        card: '12px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
