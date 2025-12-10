import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          DEFAULT: "#1459FF",
          dark: "#0F3FCC",
          light: "#E0E9FF",
        },
        accent: "#19C37D",
        warning: "#FFB347",
        danger: "#FF5A5F",
        ink: {
          50: "#F5F7FB",
          100: "#E6ECF7",
          200: "#C9D6EC",
          300: "#AABDDF",
          400: "#7A98CE",
          500: "#4A74BE",
          600: "#3457A2",
          700: "#283F79",
          800: "#1B2951",
          900: "#0E152A",
        },
      },
      boxShadow: {
        card: "0 20px 45px -30px rgba(20, 89, 255, 0.4)",
      },
      backgroundImage: {
        "grid-overlay":
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.18) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};

export default config;
