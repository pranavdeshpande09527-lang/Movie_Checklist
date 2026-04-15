/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#0f0f13',
        surface: '#1a1a24',
        'surface-2': '#232335',
        border: '#2a2a3d',
        accent: '#e50914',
        'accent-orange': '#ff6b35',
        gold: '#f5c518',
        success: '#22d3a8',
        muted: '#8888a0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease',
        'fade-in': 'fadeIn 0.3s ease',
        'shimmer': 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
}
