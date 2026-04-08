import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          0: "#0a0a0b",
          1: "#111113",
          2: "#18181b",
          3: "#1f1f23",
          4: "#27272b",
        },
        border: {
          subtle: "#1f1f23",
          DEFAULT: "#27272b",
          strong: "#3f3f46",
        },
        accent: {
          DEFAULT: "#818cf8",
          dim: "#6366f1",
          bright: "#a5b4fc",
          glow: "rgba(129, 140, 248, 0.15)",
        },
        success: { DEFAULT: "#34d399", dim: "#059669" },
        warning: { DEFAULT: "#fbbf24", dim: "#d97706" },
        danger: { DEFAULT: "#f87171", dim: "#dc2626" },
        muted: "#52525b",
        subtle: "#3f3f46",
      },
      fontFamily: {
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: {
        pill: "9999px",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
