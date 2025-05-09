/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3B82F6",
        secondary: "#6B7280",
        accent: "#8B5CF6",
        dark: {
          DEFAULT: "#111827",
          light: "#1F2937",
        },
        light: {
          DEFAULT: "#FFFFFF",
          dark: "#F9FAFB",
        }
      },
    },
  },
  plugins: [],
} 