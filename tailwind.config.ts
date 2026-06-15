import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      colors: {
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        earth: {
          50: '#fdf9f0',
          100: '#fdf3e0',
          200: '#fae8c0',
          300: '#f5d080',
          400: '#f0b840',
          500: '#d49520',
          600: '#a87015',
          700: '#7c5010',
          800: '#5a380c',
          900: '#3a2408',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'farm-gradient': 'linear-gradient(135deg, #ecfdf5 0%, #fdf9f0 50%, #fef9ee 100%)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'emerald-sm': '0 1px 3px 0 rgb(5 150 105 / 0.1)',
        'emerald-md': '0 4px 6px -1px rgb(5 150 105 / 0.1)',
        'emerald-lg': '0 10px 15px -3px rgb(5 150 105 / 0.1)',
      },
    },
  },
  plugins: [],
};

export default config;
