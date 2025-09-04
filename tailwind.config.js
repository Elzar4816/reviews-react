import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        global: ['Nunito', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
    daisyui,
    function ({ addUtilities }) {
      addUtilities({
        '.hide-scrollbar': {
          /* для WebKit */
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          /* для Firefox */
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
        },
      });
    },
  ],
  daisyui: {
    themes: ['light', 'dark'],
  },
}
