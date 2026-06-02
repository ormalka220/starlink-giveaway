/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // SpotNet space-tech palette (token names kept for backwards compatibility)
        forti: {
          red: '#F97C1D',       // SpotNet primary orange
          dark: '#030508',      // deep space base
          panel: '#0A0D14',
          panel2: '#10141F',
          line: '#1A1F2E',
          mute: '#8A93AD',
          ink: '#FFFFFF',
          accent: '#FFA04D',    // warm light-orange accent (replaces cyan)
          green: '#22C55E',
        },
        spotnet: {
          orange: '#F97C1D',
          orangeLight: '#FFA04D',
          orangeBright: '#FF8C3A',
          orangeDark: '#D4600A',
          shootHead: '#FFC882',
        },
      },
      fontFamily: {
        sans: ['Heebo', 'Assistant', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(249,124,29,0.4), 0 6px 30px rgba(249,124,29,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
        glowStrong: '0 8px 40px rgba(249,124,29,0.40), 0 0 0 1px rgba(249,124,29,0.55)',
        glowBlue: '0 0 40px rgba(249, 124, 29, 0.30)',
        glowSoft: '0 0 20px rgba(249,124,29,0.08)',
      },
      backgroundImage: {
        'grid-cyber':
          'linear-gradient(rgba(249,124,29,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(249,124,29,0.05) 1px, transparent 1px)',
        'space': 'linear-gradient(180deg, #000000 0%, #020204 30%, #010102 60%, #000000 100%)',
        'orange-pill': 'linear-gradient(135deg, #FFA04D 0%, #F97C1D 40%, #D4600A 100%)',
        'headline-1': 'linear-gradient(135deg, #ffffff 0%, #ffffff 45%, #F97C1D 100%)',
        'headline-2': 'linear-gradient(to right, #ffffff 30%, #F97C1D)',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'fade-in': 'fadeIn 0.6s ease-out',
        'scale-in': 'scaleIn 0.5s ease-out',
        'bounce-slow': 'bounceSlow 2.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.92)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        bounceSlow: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(6px)' } },
      },
    },
  },
  plugins: [],
};
