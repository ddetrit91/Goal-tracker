/** @type {import('tailwindcss').Config} */
export default {
  // <-- ДОБАВЛЕНО: Включение ручного управления темой через класс
  darkMode: 'class', 
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        category: {
          'self-development': '#6366f1',
          dream: '#ec4899',
          altruism: '#10b981',
          wishlist: '#f59e0b',
          health: '#14b8a6',
          career: '#3b82f6',
          relationships: '#8b5cf6',
          custom: '#64748b',
        },
      },
    },
  },
  plugins: [],
};