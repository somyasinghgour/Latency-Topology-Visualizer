/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}", // if using Next.js App Router
    "./pages/**/*.{js,ts,jsx,tsx}", // for Pages Router
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      // Custom colors, fonts, spacing etc. can be added here
      colors: {
        latency: {
          low: "#10b981", // green
          medium: "#facc15", // yellow
          high: "#ef4444", // red
        },
      },
    },
  },
  plugins: [],
};
