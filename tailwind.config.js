/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'void-black': '#000000',
        'charcoal': '#111111',
        'neon-blue': '#007AFF',
      },
      backdropBlur: {
        'xl': '24px',
        '2xl': '40px',
      },
      borderRadius: {
        '3xl': '24px',
      }
    },
  },
  plugins: [],
}
