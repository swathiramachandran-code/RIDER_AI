/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#2f7bff",
          "blue-glow": "#3b82f6",
          orange: "#ff7a2f",
          "orange-glow": "#fb923c",
          dark: "#0b0f1a",
          "dark-card": "rgba(255, 255, 255, 0.05)",
          "dark-border": "rgba(255, 255, 255, 0.10)",
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Rajdhani", "Orbitron", "sans-serif"],
        tech: ["Orbitron", "Rajdhani", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(47, 123, 255, 0.4)",
        "glow-orange": "0 0 25px -5px rgba(255, 122, 47, 0.4)",
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)"
      }
    },
  },
  plugins: [],
}
