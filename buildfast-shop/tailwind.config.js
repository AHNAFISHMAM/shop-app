/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gold': '#C59D5F',
        'gold-dark': '#B38B4F',
        'dark-bg': '#050509',
        'dark-bg-secondary': '#1a1a1a',
      },
      transitionDuration: {
        '3000': '3000ms',
        '5000': '5000ms',
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar-hide'),
  ],
}
