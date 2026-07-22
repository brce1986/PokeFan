/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#bc000a", // Pokédex Red
        "primary-container": "#ea000f",
        "on-primary": "#ffffff",
        "on-primary-container": "#fffbff",
        secondary: "#745b00", // Darker Pikachu Yellow for contrast
        "secondary-container": "#ffcb09", // Classic Pikachu Yellow
        "on-secondary-container": "#6f5700",
        tertiary: "#3c4dcb", // Water Blue
        "tertiary-container": "#5768e6",
        "on-tertiary-container": "#fffbff",
        background: "#f8f9fa",
        "on-background": "#191c1d",
        surface: "#f8f9fa",
        "on-surface": "#191c1d",
        "on-surface-variant": "#5f3f3a",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f3f4f5",
        "surface-container": "#edeeef",
        "surface-container-high": "#e7e8e9",
        "surface-container-highest": "#e1e3e4",
        "outline-variant": "#eabcb6",
        "surface-variant": "#e1e3e4",
        error: "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Quicksand', 'sans-serif'],
      },
      boxShadow: {
        'ambient-lvl1': '0 4px 12px rgba(0, 0, 0, 0.04)',
        'ambient-lvl2': '0 8px 24px rgba(188, 0, 10, 0.12)', // Pokedex red tinted shadow
      }
    },
  },
  plugins: [],
}
