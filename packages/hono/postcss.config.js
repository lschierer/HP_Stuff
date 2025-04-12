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
  "postcss-sorting": {
    order: ["custom-properties", "declarations", "at-rules", "rules"],
    "properties-order": "alphabetical",
  },
  autoprefixer: {},
};

// Add cssnano only in build mode
if (process.env.NODE_ENV === "production") {
  plugins["cssnano"] = {
    preset: "default",
  };
}

console.log("PostCSS plugins:", Object.keys(plugins));

export default {
  plugins,
};
