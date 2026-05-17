/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        secondary: '#7C3AED',
        accent: '#06B6D4',
        background: {
          DEFAULT: '#FAFBFC',
          dark: '#0F1117'
        },
        sidebar: {
          DEFAULT: '#1E1B4B',
          dark: '#1E1B4B'
        },
        text: {
          DEFAULT: '#1E293B',
          dark: '#E2E8F0'
        },
        border: {
          DEFAULT: '#E2E8F0',
          dark: '#334155'
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      borderRadius: {
        'card': '16px',
      },
      fontFamily: {
        'display': ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        'dark-gradient': 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
      },
      boxShadow: {
        'brand': '0 10px 40px rgba(79, 70, 229, 0.15)',
        'elegant': '0 8px 32px rgba(0, 0, 0, 0.08)',
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        'modal': '0 20px 60px rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.08)',
      }
    },
  },
  plugins: [],
}
