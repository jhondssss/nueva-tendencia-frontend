module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cafe: {
          950: '#1C1008', 900: '#2C1810', 800: '#3D2418',
          700: '#4E3020', 600: '#5C3D2A', 500: '#8B5E3C',
          400: '#A67850', 300: '#C49470', 200: '#DDB898',
          100: '#EDD8C4', 50: '#F7EDE4',
        },
        dorado: {
          600: '#9A6B1A', 500: '#C6A75E', 400: '#D4B87A',
          300: '#E2CA96', 200: '#EEDCB2', 100: '#F5EECE',
        },
        crema: { DEFAULT: '#FAFAF8', dark: '#F0EBE4', darker: '#E8DDD4' },
        surface: { DEFAULT: '#FFFFFF', raised: '#FAFAF8', border: '#E8DDD4' },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: { '2xs': ['0.625rem', { lineHeight: '1rem' }] },
      boxShadow: {
        'glow-cafe': '0 0 20px rgba(139,94,60,0.2)',
        'glow-sm': '0 0 8px rgba(139,94,60,0.15)',
        'card': '0 1px 3px rgba(44,24,16,0.08), 0 1px 2px rgba(44,24,16,0.06)',
        'card-hover': '0 4px 16px rgba(44,24,16,0.12), 0 1px 4px rgba(44,24,16,0.08)',
        'modal': '0 25px 50px rgba(44,24,16,0.25)',
        'sidebar': '2px 0 8px rgba(44,24,16,0.15)',
      },
      backgroundImage: {
        'cafe-gradient': 'linear-gradient(135deg, #8B5E3C 0%, #2C1810 100%)',
        'dorado-gradient': 'linear-gradient(135deg, #C6A75E 0%, #9A6B1A 100%)',
      },
      animation: {
        'fade-in':       'fadeIn 0.3s ease-out',
        'slide-up':      'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer':       'shimmer 1.5s infinite',
        'ripple':        'ripple 0.5s ease-out',
        'slide-in-right':'slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn:       { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:      { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        shimmer:      { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        ripple:       { '0%': { transform: 'scale(0)', opacity: '0.6' }, '100%': { transform: 'scale(2.5)', opacity: '0' } },
        slideInRight: { '0%': { opacity: '0', transform: 'translateX(40px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
      },
      transitionTimingFunction: { spring: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    },
  },
  plugins: [],
}
