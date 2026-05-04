/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        dark: {
          900: '#121212',
          800: '#1e1e1e',
          700: '#2d2d2d',
          600: '#3f3f3f',
        },
        brand: {
          500: '#6366f1',
          600: '#4f46e5',
        }
      }
    },
  },
  plugins: [],
}
