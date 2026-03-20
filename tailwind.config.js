/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dao: {
          primary: '#8B4513',
          secondary: '#D2691E',
          gold: '#B8860B',
          dark: '#2C1810',
          light: '#FDF5E6',
        },
      },
      fontFamily: {
        dao: ['Georgia', 'serif'],
      },
      transitionDuration: {
        '200': '200ms',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
};