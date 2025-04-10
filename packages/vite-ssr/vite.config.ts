import { defineConfig } from "vite";
import { resolve } from "path";
import ssg from "@hono/vite-ssg";
import build from "@hono/vite-build/node";
import devServer from "@hono/vite-dev-server";

export default defineConfig({
  resolve: {
    alias: {
      "@client": resolve(__dirname, "./src/client"),
      "@server": resolve(__dirname, "./src/server"),
      "@shared": resolve(__dirname, "./src/shared"),
    },
  },
  plugins: [
    devServer({
      entry: "./src/server/entry-server.ts",
    }),
    build({
      entry: "./src/server/server.ts",
      port: 3001,
    }),
    ssg({
      entry: "./src/server/entry-server.ts",
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
      output: {
        entryFileNames: (chunk) => {
          return chunk.name.includes("server")
            ? "server/[name].js"
            : "client/[name].js";
        },
      },
    },
  },
});
