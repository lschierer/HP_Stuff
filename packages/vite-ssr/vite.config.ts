import { defineConfig } from "vite";
import { resolve } from "path";
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
      entry: "./src/server/server.ts", // Point to server.ts instead of entry-server.ts
      exclude: [],
      // Add HMR options
      hmr: {
        // Enable HMR for server code
        server: true,
      },
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
  // Add this to see more detailed logs
  logLevel: "info",
});
