/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#15140F",
        surface: "#221F19",
        surface2: "#2A2620",
        manila: "#D4C49A",
        manilaDark: "#B8A87C",
        redaction: "#0B0B0A",
        string: "#C23B22",
        stringDim: "#7A3024",
        ink: "#E8E2D0",
        inkDim: "#A89F88",
        stamp: "#4A6B4A",
      },
      fontFamily: {
        stamp: ["'Special Elite'", "monospace"],
        mono: ["'IBM Plex Mono'", "monospace"],
        body: ["'IBM Plex Sans'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
