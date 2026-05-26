/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        forti: {
          red: '#EE3124',
          dark: '#0A0E1A',
          panel: '#111726',
          panel2: '#161D30',
          line: '#1F2740',
          mute: '#8A93AD',
          ink: '#E8ECF5',
          accent: '#22D3EE',
          green: '#22C55E',
        },
      },
      fontFamily: {
        sans: ['Heebo', 'Assistant', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px rgba(238, 49, 36, 0.35)',
        glowBlue: '0 0 40px rgba(34, 211, 238, 0.35)',
      },
      backgroundImage: {
        'grid-cyber':
          'linear-gradient(rgba(34,211,238,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.06) 1px, transparent 1px)',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.9)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
};
