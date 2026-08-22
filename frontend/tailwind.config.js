/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF0FF',
          100: '#E5E6FF',
          200: '#D4D5FF',
          300: '#B8BAFF',
          400: '#8F91F2',
          500: '#6D6EE8',
          600: '#5B5CE2',
          700: '#4F50D5',
          800: '#4142B7',
          900: '#34358F',
          950: '#24255F',
        },
        crowd: {
          empty: '#16A34A',
          low: '#16A34A',
          medium: '#D97706',     // Amber
          high: '#DC2626',
          veryHigh: '#B91C1C',
          unknown: '#9CA3AF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(23, 24, 26, 0.04)',
        'subtle': '0 4px 16px -4px rgba(23, 24, 26, 0.06)',
        'elevation': '0 8px 24px -8px rgba(23, 24, 26, 0.10)',
      },
      borderRadius: {
        'xl': '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
