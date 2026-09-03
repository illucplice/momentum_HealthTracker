/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0a0a0b',
        surface: '#131316',
        elevated: '#1a1a1f',
        hover: '#222228',
        subtle: '#26262d',
        'border-d': '#33333b',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease',
        'slide-up': 'slideUp 0.3s ease',
        'slide-down': 'slideDown 0.3s ease',
        'scale-in': 'scaleIn 0.2s ease',
      },
    },
  },
  plugins: [],
};
