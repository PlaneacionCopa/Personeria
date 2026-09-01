/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#EEF0F7",
          100: "#DDE1EF",
          200: "#BBC3DF",
          300: "#99A5CF",
          400: "#6674B5",
          500: "#3A478F",
          600: "#2E3973",
          700: "#252E5C",
          800: "#21294C",
          900: "#151B33"
        },
      },
      boxShadow: {
        soft: "0 10px 30px rgba(17, 24, 39, 0.12)",
      },
    },
  },
  plugins: [],
};
