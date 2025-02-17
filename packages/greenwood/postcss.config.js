import path from "path";
import process from "node:process";

const plugins = {
  "postcss-import": {
    path: [
      path.resolve(new URL(import.meta.url).pathname, "..", "node_modules"),
    ],
  },
  "postcss-extend": {},
  "postcss-nesting": {},
  autoprefixer: {},
};

// Conditional plugin inclusion based on environment
if (!process.env.__GWD_COMMAND__ === "serve") {
  plugins["cssnano"] = {
    preset: "default",
  };
}
console.log(`postcss plugins are ${JSON.stringify(plugins)}`);
export default {
  plugins: plugins,
};

/*
const plugins = {[}
    postcssImport({
      path: [
        path.resolve(new URL(import.meta.url).pathname, "..", "node_modules"),
      ],
    }),
    postcssExtend(),
    nesting(),
    autoprefixer,
    // Add other PostCSS plugins here if needed
  ]
*/
