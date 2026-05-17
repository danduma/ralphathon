import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        iron: "oklch(var(--iron) / <alpha-value>)",
        soot: "oklch(var(--soot) / <alpha-value>)",
        ember: "oklch(var(--ember) / <alpha-value>)",
        brass: "oklch(var(--brass) / <alpha-value>)",
        copper: "oklch(var(--copper) / <alpha-value>)",
        enamel: "oklch(var(--enamel) / <alpha-value>)"
      },
      boxShadow: {
        furnace: "0 0 36px oklch(0.68 0.19 45 / 0.42)"
      }
    }
  },
  plugins: []
} satisfies Config;
