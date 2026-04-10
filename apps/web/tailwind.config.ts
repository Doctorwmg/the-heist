import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        heist: {
          bg: {
            primary: '#0a0a0a',
            secondary: '#111111',
            tertiary: '#1a1a1a',
          },
          border: {
            DEFAULT: '#2a2a2a',
            active: '#d4a843',
          },
          text: {
            primary: '#f0f0f0',
            secondary: '#888888',
            accent: '#d4a843',
          },
          accent: {
            DEFAULT: '#d4a843',
            hover: '#c49b38',
            glow: 'rgba(212, 168, 67, 0.15)',
          },
          success: '#4ade80',
          danger: '#ef4444',
          warning: '#f59e0b',
          info: '#60a5fa',
          terminal: {
            bg: '#0d0d0d',
            text: '#d4a843',
          },
          classified: {
            red: '#8b0000',
            bg: 'rgba(139, 0, 0, 0.1)',
          },
        },
      },
      fontFamily: {
        display: ["'Black Ops One'", 'Impact', 'sans-serif'],
        body: ["'Inter'", "'Segoe UI'", 'sans-serif'],
        mono: ["'Fira Code'", "'Droid Sans Mono'", 'monospace'],
      },
      borderRadius: {
        tactical: '2px',
      },
      keyframes: {
        'stamp-slam': {
          '0%': { transform: 'rotate(-12deg) scale(1.5)', opacity: '0' },
          '50%': { transform: 'rotate(-12deg) scale(0.95)', opacity: '0.9' },
          '100%': { transform: 'rotate(-12deg) scale(1)', opacity: '0.7' },
        },
        'pulse-amber': {
          '0%, 100%': { borderColor: '#d4a843', boxShadow: '0 0 0 0 rgba(212, 168, 67, 0.4)' },
          '50%': { borderColor: '#c49b38', boxShadow: '0 0 8px 2px rgba(212, 168, 67, 0.2)' },
        },
        'intel-slide': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'check-draw': {
          '0%': { strokeDashoffset: '24' },
          '100%': { strokeDashoffset: '0' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 4px rgba(212, 168, 67, 0.2)' },
          '50%': { boxShadow: '0 0 12px rgba(212, 168, 67, 0.4)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'cursor-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'stage-complete-stamp': {
          '0%': { transform: 'scale(2)', opacity: '0' },
          '60%': { transform: 'scale(0.9)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'badge-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'float-particle': {
          '0%, 100%': { transform: 'translateY(0) translateX(0)', opacity: '0.3' },
          '25%': { transform: 'translateY(-20px) translateX(10px)', opacity: '0.6' },
          '50%': { transform: 'translateY(-10px) translateX(-5px)', opacity: '0.3' },
          '75%': { transform: 'translateY(-30px) translateX(15px)', opacity: '0.5' },
        },
      },
      animation: {
        'stamp-slam': 'stamp-slam 0.4s ease-out forwards',
        'pulse-amber': 'pulse-amber 2s ease-in-out infinite',
        'intel-slide': 'intel-slide 0.3s ease-out',
        'check-draw': 'check-draw 0.3s ease-out forwards',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'scan-line': 'scan-line 8s linear infinite',
        'cursor-blink': 'cursor-blink 1s step-end infinite',
        'stage-complete': 'stage-complete-stamp 0.5s ease-out forwards',
        'badge-pulse': 'badge-pulse 2s ease-in-out infinite',
        'float-particle': 'float-particle 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
