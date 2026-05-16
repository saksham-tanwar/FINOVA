/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        banking: {
          dark: "#0a0f1e",
          card: "#1a2235",
          border: "#1e293b",
          accent: "#3b82f6",
          cyan: "#06b6d4",
        },
      },
    },
  },
  plugins: [],
}
