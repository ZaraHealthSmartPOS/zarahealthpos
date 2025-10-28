/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'zara-gray': '#f3f4f6',
        'zara-lime': '#AEEA00'
      }
    },
  },
  plugins: [],
}
