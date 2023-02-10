/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./resources/views/home.blade.php',
            "./resources/js/app.js",
            "./resources/js/bootsrap.js",
            "./resources/css/app.css",],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: '16px',
    },
    extend: {
      colors: {
        primary: '#14b8a6',
        secondary: '#64748b',
        dark: '#0f172a',
        orange: '#fb923c'
      },
      screens: {
        '2xl': '1320px',
      },
    },
  },
  plugins: [],
};
