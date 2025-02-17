import path from "path";
import postcssImport from "postcss-import";
import postcssExtend from "postcss-extend";
import nesting from "postcss-nesting";
import cssnano from "cssnano";
import autoprefixer from "autoprefixer";

const ctx = {
  cssnano: !process.env.__GWD_COMMAND__ === "serve",
};

export default (ctx) => {
  const plugins = {
    autoprefixer: {},
    "postcss-import": {},
  };

  // Conditional plugin inclusion based on environment
  if (ctx.cssnano) {
    plugins["cssnano"] = {
      preset: "default",
    };
  }

  return {
    plugins,
  };
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
