import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        muted: "#738096",
        brand: "#5B63D3",
        canvas: "#F5F6FA"
      },
      boxShadow: {
        soft: "0 10px 35px rgba(31, 41, 55, 0.06)"
      }
    }
  },
  plugins: []
};
export default config;
