/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Cormorant Garamond", "ui-serif", "Georgia", "serif"],
      },
      keyframes: {
        milestonePulse: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "35%": { transform: "scale(1.06)", opacity: "0.9" },
          "100%": { transform: "scale(1.2)", opacity: "0" }
        }
      },
      animation: {
        milestonePulse: "milestonePulse 550ms ease-out"
      }
    },
  },
  plugins: [],
};