/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{js,jsx}',
    './pages/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#172033',
        muted: '#5f6b7a',
        line: '#d8dee8',
        surface: '#f7f9fc',
        brand: '#2563eb',
      },
      boxShadow: {
        soft: '0 12px 30px rgba(23, 32, 51, 0.08)',
      },
    },
  },
  plugins: [],
};
