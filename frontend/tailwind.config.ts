import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0442d2',
          50: '#ecf7ff',
          100: '#d5ecff',
          200: '#b4dfff',
          300: '#80ccff',
          400: '#44aeff',
          500: '#1989ff',
          600: '#0167ff',
          700: '#004ffa',
          800: '#0442d2',
          900: '#0b3b9d',
          950: '#0c255f',
        },
        // Semantic tokens (Shadcn-style). These map to CSS vars you’ll set below.
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
        },
        ring: 'rgb(var(--ring) / <alpha-value>)',
      },
      borderColor: {
        DEFAULT: 'rgb(var(--border) / <alpha-value>)',
      },
      backgroundColor: {
        DEFAULT: 'rgb(var(--background) / <alpha-value>)',
      },
      textColor: {
        DEFAULT: 'rgb(var(--foreground) / <alpha-value>)',
      },
    },
  },
  plugins: [],
};

export default config;
