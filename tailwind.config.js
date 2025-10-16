/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
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
        'brand-dark': '#12122D',
        'brand-accent': '#6464FF',
      },
      keyframes: {
        'shine': {
          "0%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "-100% 50%" },
        },
      },
      animation: {
        'shine': "shine 8s linear infinite",
      },
    },
  },
  plugins: [],
}