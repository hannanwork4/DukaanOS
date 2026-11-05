/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pure Black & White / Neutral Monochrome Theme
        brand: {
          black: '#09090b',
          dark: '#18181b',
          card: '#27272a',
          muted: '#71717a',
          border: '#e4e4e7',
          light: '#f4f4f5',
          white: '#ffffff',
        }
      },
      boxShadow: {
        'glass-3d': '0 8px 32px 0 rgba(0, 0, 0, 0.06), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9), inset 0 -1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card-3d': '0 10px 30px -4px rgba(0, 0, 0, 0.05), 0 4px 10px -2px rgba(0, 0, 0, 0.02), inset 0 1px 0 0 rgba(255, 255, 255, 0.9)',
        'card-3d-hover': '0 20px 40px -8px rgba(0, 0, 0, 0.12), 0 8px 16px -4px rgba(0, 0, 0, 0.04), inset 0 1px 0 0 rgba(255, 255, 255, 1)',
        'btn-3d': '0 6px 16px -2px rgba(0, 0, 0, 0.4), inset 0 1px 1px 0 rgba(255, 255, 255, 0.25), 0 2px 0 0 #000000',
        'btn-3d-white': '0 4px 14px -1px rgba(0, 0, 0, 0.08), inset 0 1px 1px 0 #ffffff, 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
