/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./docs/**/*.{md,mdx}",
    "./docusaurus.config.js",
    "./sidebars.js"
  ],
  theme: {
    extend: {
      colors: {
        'robotics-blue': '#1e40af', // Primary blue color
      }
    },
  },
  plugins: [],
}