import type { MarkdownModule } from "@gracile/markdown/module";

export const Harrypedia = import.meta.glob<MarkdownModule>(
  "/src/content/Harrypedia/**/*.md",
  { eager: true, import: "default" },
);

import index from "./index.md";
export const indexDoc = index;
