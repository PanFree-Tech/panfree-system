/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'panfree-verde': '#334c2b',
        'panfree-naranja': '#f46e15',
        'panfree-dorado': '#b7996b',
        'panfree-crema': '#eee6d9',
      },
    },
  },
  plugins: [],
}