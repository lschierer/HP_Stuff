const starlightPlugin = require("@astrojs/starlight-tailwind");
const typography = require("@tailwindcss/typography");

// Generated color palettes
const accent = {
  200: "#a2cef5",
  600: "#0071b3",
  900: "#003558",
  950: "#002641",
}; //hue 245 chroma 0.214
const gray = {
  100: "#f1f7fc",
  200: "#e4eff8",
  300: "#b7c4cf",
  400: "#758fa3",
  500: "#435b6e",
  700: "#243b4c",
  800: "#122939",
  900: "#0f1921",
}; //hue 241 chroma 0.042
const transparent = "transparent";
const lochmara = {
  50: "#f0f9ff",
  100: "#e1f3fd",
  200: "#bce6fb",
  300: "#81d5f8",
  400: "#3ebff2",
  500: "#15a7e2",
  600: "#0885bf",
  700: "#086b9c",
  800: "#0b5b81",
  900: "#0f4b6b",
  950: "#0a3047",
};

module.exports = {
  syntax: "postcss-lit",
  darkMode: "class",
  content: {
    files: ["./src/components/**/*.{js,ts}"],
  },
  theme: {
    extend: {
      colors: { accent, lochmara, gray, transparent },
    },
  },
  plugins: [starlightPlugin(), typography()],
};

/*
// Dark mode colors.
:root {
  --sl-color-accent-low: #002641;
  --sl-color-accent: #006fb0;
  --sl-color-accent-high: #a2cef5;
  --sl-color-white: #ffffff;
  --sl-color-gray-1: #e4eff8;
  --sl-color-gray-2: #b7c4cf;
  --sl-color-gray-3: #758fa3;
  --sl-color-gray-4: #435b6e;
  --sl-color-gray-5: #243b4c;
  --sl-color-gray-6: #122939;
  --sl-color-black: #0f1921;
}
// Light mode colors.
:root[data-theme='light'] {
  --sl-color-accent-low: #badbf8;
  --sl-color-accent: #0071b3;
  --sl-color-accent-high: #003558;
  --sl-color-white: #0f1921;
  --sl-color-gray-1: #122939;
  --sl-color-gray-2: #243b4c;
  --sl-color-gray-3: #435b6e;
  --sl-color-gray-4: #758fa3;
  --sl-color-gray-5: #b7c4cf;
  --sl-color-gray-6: #e4eff8;
  --sl-color-gray-7: #f1f7fc;
  --sl-color-black: #ffffff;
}
 */
