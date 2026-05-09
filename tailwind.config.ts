import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        syne: ["Syne", "sans-serif"],
        dm: ["DM Sans", "sans-serif"],
      },
      colors: {
        accent: "#6c47ff",
        accent2: "#8b6fff",
        lime: "#b8ff57",
        surface: "#1e1e28",
        surface2: "#252533",
        bg: "#0a0a0f",
        bg2: "#111118",
        bg3: "#18181f",
      },
      animation: {
        "slide-up": "slideUp 0.4s cubic-bezier(0.4,0,0.2,1) backwards",
        "fade-in": "fadeIn 0.3s ease backwards",
        "scale-in": "scaleIn 0.25s cubic-bezier(0.4,0,0.2,1) backwards",
      },
      keyframes: {
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
