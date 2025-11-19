/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // 기본 폰트(sans)를 'ZenSerif'로 설정합니다.
        sans: ['ZenSerif', 'sans-serif']
      }
    },
  },
  plugins: [],
}