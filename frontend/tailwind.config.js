/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // First Derivative Brand Colors from the style guide
        'fd-dark': '#3f4857',        // Dark background color
        'fd-darker': '#2a2f3a',      // Darker variant for cards/sections
        'fd-green': '#00ff85',       // Primary brand green
        'fd-green-hover': '#00e676',  // Hover state for green
        'fd-text': '#ffffff',        // Primary white text
        'fd-text-muted': '#b0bec5',  // Muted text color
        'fd-border': '#4a5568',      // Border color
        'fd-input': '#4a5568',       // Input background
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'fd': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
      }
    },
  },
  plugins: [],
}
