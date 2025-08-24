/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        script: ['"Great Vibes"', "cursive"],
      },
    },
  },
  plugins: [
    require("tailwind-scrollbar"),
    require("@tailwindcss/aspect-ratio"),

    // Plugin to prevent text selection only on interactive elements
    function ({ addBase }) {
      addBase({
        /* Prevent text selection on interactive UI elements */
        'button, [role="button"], .cursor-pointer, input[type="button"], input[type="submit"]': {
          userSelect: 'none',
        },

        /* Allow text selection on copyable elements */
        'input, textarea, a.copyable': {
          userSelect: 'text',
        },
      });
    },
  ],
};
