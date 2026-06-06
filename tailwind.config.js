/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // 莫兰迪治愈色系 — Morandi muted palette
        sand: {
          50: '#FAF8F4',
          100: '#F3EFE8',
          200: '#E9E3D9',
          300: '#DBD3C5',
          400: '#C7BCAA',
        },
        clay: {
          300: '#C9ADA7',
          400: '#B89A92',
          500: '#A47F76',
        },
        sage: {
          300: '#A9B49A',
          400: '#909E7E',
          500: '#76876A',
        },
        mist: {
          300: '#A3AEB0',
          400: '#889698',
          500: '#6F7E80',
        },
        ink: {
          400: '#7A736B',
          500: '#5F5851',
          600: '#4A443E',
          700: '#36322D',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['"Inter"', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'soft-pulse': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out both',
        'soft-pulse': 'soft-pulse 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
