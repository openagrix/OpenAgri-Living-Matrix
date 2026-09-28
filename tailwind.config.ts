import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep forest / OneSoil-inspired agri tech palette
        forest: {
          950: "#030a06",
          900: "#05140c",
          800: "#0a1f14",
          700: "#0f2e1c",
          600: "#164028",
          500: "#1d5334",
        },
        agri: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#3ddc84",
          600: "#22c55e",
          700: "#16a34a",
          800: "#15803d",
          900: "#14532d",
          950: "#052e16",
        },
        cream: {
          50: "#fbfaf6",
          100: "#f5f3eb",
          200: "#ebe7da",
        },
        soil: {
          50: "#fdf8f0",
          100: "#fcefd8",
          200: "#f8d9a8",
          300: "#f3bc6e",
          400: "#ed9a35",
          500: "#e87e14",
          600: "#d9620e",
          700: "#b4480e",
          800: "#903a13",
          900: "#753113",
          950: "#3f1707",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        glow: "0 0 60px -12px rgba(61, 220, 132, 0.35)",
        "glow-sm": "0 0 24px -8px rgba(61, 220, 132, 0.4)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "soft-pulse": {
          "0%, 100%": { opacity: "0.45" },
          "50%": { opacity: "0.8" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s ease-out both",
        "fade-up-delay": "fade-up 0.7s ease-out 0.15s both",
        "fade-up-delay-2": "fade-up 0.7s ease-out 0.3s both",
        "soft-pulse": "soft-pulse 5s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
