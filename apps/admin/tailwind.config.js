/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#0B4745',
          'green-dark': '#062E2D',
          'green-light': '#0E5C59',
          gold: '#DCBB87',
          'gold-light': '#EDE4C9',
          cream: '#FAF7F2',
          sand: '#E8DFC8',
          ink: '#0A2E2C',
          muted: '#5C726F',
        },
        primary: {
          DEFAULT: '#0B4745',
          50: '#E8F2F2',
          100: '#D1E5E4',
          200: '#A3CBC9',
          300: '#6BA8A5',
          400: '#3D8581',
          500: '#0B4745',
          600: '#093A38',
          700: '#072D2C',
          800: '#052120',
          900: '#031514',
        },
        accent: {
          DEFAULT: '#DCBB87',
          50: '#FBF7EF',
          100: '#F5ECD8',
          400: '#DCBB87',
          500: '#C4A063',
          600: '#A88450',
          700: '#8C6840',
        },
      },
      fontFamily: {
        sans: ['Tajawal', 'Cairo', 'system-ui', 'sans-serif'],
        display: ['Cairo', 'Tajawal', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(11, 71, 69, 0.05), 0 12px 32px -8px rgba(11, 71, 69, 0.14)',
        glow: '0 8px 28px -6px rgba(11, 71, 69, 0.35)',
      },
    },
  },
  plugins: [],
};
