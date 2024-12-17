import { gracile } from "@gracile/gracile/plugin";
import { defineConfig } from "vite";
import { viteMarkdownPlugin } from "@gracile/markdown/vite";
import { MarkdownRenderer } from "@gracile/markdown-preset-marked";
import { viteSvgPlugin } from "@gracile/svg/vite";

const cachedOldVersions = ["/old/**/*.ts", "/old/**/*.js", "old/**/*.cjs"];

export default defineConfig({
  build: {
    rollupOptions: {
      external: [...cachedOldVersions],
    },
  },
  server: {
    port: 3030,
    watch: {
      ignored: [...cachedOldVersions],
    },
  },
  preview: { port: 3030 },
  ssr: {
    external: [...cachedOldVersions],
  },
  plugins: [
    viteMarkdownPlugin({ MarkdownRenderer }),
    viteSvgPlugin(),
    gracile({
      routes: {
        exclude: [...cachedOldVersions],
      },
    }),
  ],
});
