import esbuild from "esbuild";
import { replace } from "esbuild-plugin-replace";

await esbuild.build({
  entryPoints: ["src/server/index.ts"],
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  outfile: "dist/server/index.js",
  external: ["fsevents", "dotenv"],
  plugins: [
    replace({
      values: {
        'require("node:process")': "({ env: {} })",
        "require('node:process')": "({ env: {} })",
      },
    }),
  ],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    // add more env vars here
  },
});
