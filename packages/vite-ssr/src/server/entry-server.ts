/**
 * SERVER-SIDE ENTRY POINT
 * This code only runs on the server
 */

import { Hono } from "hono";
import { renderApp } from "@shared/app";
import { defaultLayout } from "./layout.ts";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { visit, SKIP, type VisitorResult } from "unist-util-visit";
import type { Element, Root, Parent } from "hast";
import debugFunction from "@shared/debug";

const DEBUG = debugFunction(new URL(import.meta.url).pathname);

// Create the Hono app
export const app = new Hono();

// Define your routes
app.get("/", async (c) => {
  const appHtml = renderApp();
  // Return the rendered HTML
  let rp: string = defaultLayout({
    title: "",
  });
  rp = String(
    await unified()
      .use(rehypeParse, { fragment: true })
      .use(() => (tree: Root) => {
        visit(
          tree,
          "element",
          (
            node: Element,
            index: number | undefined,
            parent: Parent | undefined
          ): VisitorResult => {
            if (node.tagName === "page-outlet" && parent) {
              const tempTree = unified()
                .use(rehypeParse, { fragment: true })
                .parse(appHtml);
              const elementNodes = tempTree.children.filter(
                (child) => child.type === "element"
              );
              parent.children.splice(index ?? 0, 1, ...elementNodes);
              return [SKIP, index];
            }
            return undefined;
          }
        );
      })
      .use(rehypeStringify)
      .process(rp)
  );
  return c.html(rp);
});

// Function to render the app on the server
export function render() {
  // Create a container for the app
  const appHtml = renderApp();

  // Return the rendered HTML
  return {
    appHtml,
    // You can add more data here to be passed to the client
  };
}

// Log to clearly identify server-side code during development
if (DEBUG) console.log("🖥️ Server-side code is running on the server");

// Export the app for SSG
export default app;
