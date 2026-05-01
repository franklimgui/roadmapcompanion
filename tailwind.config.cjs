/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: "#0c0c0c",
          soft: "#141414",
          elevated: "#1a1a1a",
        },
        lime: {
          DEFAULT: "#ccff00",
          dim: "#a3cc00",
        },
        "emerald-glow": "#10b981",
        "primary-white": "#ebebeb",
      },
      fontFamily: {
        heading: ['"Space Grotesk"', "ui-sans-serif", "system-ui", "sans-serif"],
        body: ['"Space Grotesk"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": {
            opacity: "1",
            boxShadow: "0 0 4px rgba(204, 255, 0, 0.6)",
          },
          "50%": {
            opacity: "0.5",
            boxShadow: "0 0 8px rgba(204, 255, 0, 0.9)",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "fade-up": "fade-up 0.4s ease-out",
      },
    },
  },
  plugins: [],
};
