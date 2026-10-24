/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        desk: {
          bg: "#0b0c10",
          surface: "#1f2833",
          idle: "#66fcb1",
          working: "#ffd93d",
          needs_you: "#ff6b6b",
          done: "#45aaf2",
          error: "#c51f1f",
          offline: "#454f5a",
        },
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      animation: {
        "pulse-fast": "pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
}
