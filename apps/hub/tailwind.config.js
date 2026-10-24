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
    },
  },
  plugins: [],
}
