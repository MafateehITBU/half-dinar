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
          'gold-dark': '#C4A063',
          cream: '#FAF7F2',
          sand: '#E8DFC8',
          ink: '#0A2E2C',
          muted: '#5C726F',
        },
        /* structural / CTAs — brand green */
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
          950: '#020D0C',
        },
        /* highlights — brand gold */
        accent: {
          DEFAULT: '#DCBB87',
          50: '#FBF7EF',
          100: '#F5ECD8',
          200: '#EDE0C0',
          300: '#E5D4A8',
          400: '#DCBB87',
          500: '#C4A063',
          600: '#A88450',
          700: '#8C6840',
          800: '#704F32',
        },
      },
      fontFamily: {
        sans: ['Tajawal', 'Cairo', 'system-ui', 'sans-serif'],
        arabic: ['Tajawal', 'Cairo', 'system-ui', 'sans-serif'],
        display: ['Cairo', 'Tajawal', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        soft: '0 4px 24px -6px rgba(11, 71, 69, 0.12)',
        card: '0 1px 2px rgba(11, 71, 69, 0.05), 0 12px 32px -8px rgba(11, 71, 69, 0.14)',
        glow: '0 8px 28px -6px rgba(11, 71, 69, 0.35)',
        gold: '0 8px 24px -6px rgba(220, 187, 135, 0.45)',
      },
      backgroundImage: {
        mesh: 'radial-gradient(at 0% 0%, rgba(11,71,69,0.08) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(220,187,135,0.15) 0px, transparent 45%)',
        'hero-gradient': 'linear-gradient(135deg, #062E2D 0%, #0B4745 50%, #0E5C59 100%)',
        'page-hero': 'linear-gradient(120deg, #062E2D 0%, #0B4745 55%, #0E5C59 100%)',
        'gold-shine': 'linear-gradient(110deg, #C4A063 0%, #DCBB87 50%, #EDE4C9 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        shimmer: 'shimmer 1.8s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
