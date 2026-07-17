import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // ── Background gradient stops ──────────────────────────────────────
        "bg-base":   "#030712",
        "bg-mid":    "#07111F",
        "bg-surface":"#0B1728",

        // ── Brand accents ──────────────────────────────────────────────────
        accent: {
          blue: {
            DEFAULT: "#3B82F6",
            light:   "#60A5FA",
            dark:    "#1D4ED8",
            glow:    "rgba(59,130,246,0.25)",
          },
          cyan: {
            DEFAULT: "#06B6D4",
            light:   "#22D3EE",
            dark:    "#0891B2",
            glow:    "rgba(6,182,212,0.25)",
          },
        },

        // ── Glassmorphism surfaces ─────────────────────────────────────────
        glass: {
          DEFAULT:  "rgba(11,23,40,0.6)",
          light:    "rgba(255,255,255,0.04)",
          border:   "rgba(255,255,255,0.08)",
          "border-accent": "rgba(59,130,246,0.30)",
        },

        // ── Semantic UI ───────────────────────────────────────────────────
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT:     "hsl(var(--primary))",
          foreground:  "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:     "hsl(var(--secondary))",
          foreground:  "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:     "hsl(var(--destructive))",
          foreground:  "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:     "hsl(var(--muted))",
          foreground:  "hsl(var(--muted-foreground))",
        },
        accent2: {
          DEFAULT:     "hsl(var(--accent))",
          foreground:  "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:     "hsl(var(--popover))",
          foreground:  "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:     "hsl(var(--card))",
          foreground:  "hsl(var(--card-foreground))",
        },

        // ── Status ────────────────────────────────────────────────────────
        status: {
          nominal:  "#10B981",
          warning:  "#F59E0B",
          critical: "#EF4444",
          inactive: "#6B7280",
        },
      },

      // ── Border radius ──────────────────────────────────────────────────
      borderRadius: {
        card: "18px",
        lg:   "var(--radius)",
        md:   "calc(var(--radius) - 2px)",
        sm:   "calc(var(--radius) - 4px)",
      },

      // ── Box shadows ────────────────────────────────────────────────────
      boxShadow: {
        card:          "0 4px 24px rgba(0,0,0,0.40), 0 1px 2px rgba(0,0,0,0.30)",
        "card-hover":  "0 8px 40px rgba(0,0,0,0.50), 0 0 24px rgba(59,130,246,0.12)",
        "glow-blue":   "0 0 24px rgba(59,130,246,0.35), 0 0 48px rgba(59,130,246,0.15)",
        "glow-cyan":   "0 0 24px rgba(6,182,212,0.35), 0 0 48px rgba(6,182,212,0.15)",
        "inner-glass": "inset 0 1px 0 rgba(255,255,255,0.08)",
      },

      // ── Typography ─────────────────────────────────────────────────────
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },

      // ── Background images (gradient helpers) ───────────────────────────
      backgroundImage: {
        "gradient-radial":   "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "app-bg":            "linear-gradient(135deg, #030712 0%, #07111F 50%, #0B1728 100%)",
        "card-glass":        "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
        "sidebar-gradient":  "linear-gradient(180deg, #07111F 0%, #030712 100%)",
        "accent-gradient":   "linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)",
      },

      // ── Animations ─────────────────────────────────────────────────────
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.5" },
        },
        shimmer: {
          from: { backgroundPosition: "0 0" },
          to:   { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "pulse-glow":     "pulse-glow 2s cubic-bezier(0.4,0,0.6,1) infinite",
        shimmer:          "shimmer 2s linear infinite",
      },

      // ── Backdrop ───────────────────────────────────────────────────────
      backdropBlur: {
        glass: "12px",
        "glass-lg": "24px",
      },
    },
  },
  plugins: [animate],
};

export default config;
