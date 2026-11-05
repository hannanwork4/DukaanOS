/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Strict 2-color brand theme: Saffron (Brand) + Slate (Professional)
        saffron: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        }
      },
      boxShadow: {
        'glass-3d': '0 8px 32px 0 rgba(15, 23, 42, 0.08), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9), inset 0 -1px 2px 0 rgba(0, 0, 0, 0.04)',
        'card-3d': '0 12px 28px -6px rgba(15, 23, 42, 0.07), 0 4px 10px -2px rgba(15, 23, 42, 0.04), inset 0 1px 0 0 rgba(255, 255, 255, 0.85)',
        'card-3d-hover': '0 20px 40px -8px rgba(217, 119, 6, 0.16), 0 8px 16px -4px rgba(15, 23, 42, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 1)',
        'btn-3d': '0 6px 16px -2px rgba(217, 119, 6, 0.4), inset 0 1px 1px 0 rgba(255, 255, 255, 0.4), 0 2px 0 0 rgba(180, 83, 9, 0.8)',
        'btn-3d-dark': '0 6px 16px -2px rgba(15, 23, 42, 0.35), inset 0 1px 1px 0 rgba(255, 255, 255, 0.2), 0 2px 0 0 rgba(2, 6, 23, 0.9)',
      }
    },
  },
  plugins: [],
}
