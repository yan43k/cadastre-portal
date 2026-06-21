/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#241a14",
        bistre: "#3d2c22",
        umber: "#5c4033",
        sepia: "#8b6f56",
        line: "#c9bba8",
        sand: "#e8dfd0",
        parchment: "#f3ece1",
        cream: "#faf7f0",
      },
      fontFamily: {
        body: ['"Times New Roman"', "Times", "serif"],
        display: ['"Cormorant Garamond"', '"Times New Roman"', "serif"],
      },
      boxShadow: {
        seal: "0 0 0 1px rgba(60,40,28,0.12), 0 12px 28px rgba(36,26,20,0.08)",
      },
      backgroundImage: {
        paper:
          "linear-gradient(180deg, rgba(250,247,240,0.97), rgba(243,236,225,0.98)), url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
