import { visit } from "unist-util-visit";
import type { ElementContent, Root } from "hast";
import { readFileSync } from "node:fs";
import { h } from "hastscript";

//central control over whether or not to output debugging
import debugFunction from "../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);

import { type NavigationItem } from "@hp-stuff/schemas";

/**
 * Check if a page contains the directory-index placeholder
 * @param ast The AST to check
 * @returns True if the page contains the directory-index placeholder
 */
export const hasDirectoryIndexPlaceholder = (ast: Root): boolean => {
  let found: boolean = false;
  visit(ast, "element", (node) => {
    if (node.tagName === "directory-index") {
      found = true;
      return false; // Stop traversal
    }

    // Also check for text nodes containing the placeholder
    for (const child of node.children) {
      if (
        child.type === "text" &&
        child.value &&
        child.value.includes("<directory-index>")
      ) {
        found = true;
        return false; // Stop traversal
      }
    }
    return true; // Continue traversal
  });
  if (DEBUG) {
    /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */
    if (found) {
      console.log(`Found a directory index`);
    } else {
      console.log(`Not a Directory Index`);
    }
  }
  return found;
};

/**
 * Create a directory index from the sidebar-routes.json file
 * @param ast The AST to modify
 * @param currentRoute The current route to find the relevant subtree
 */
export const createDirectoryIndex = (
  ast: Root,
  currentRoute?: string
): void => {
  try {
    // Read the sidebar-routes.json file
    const sidebarRoutesPath = new URL(
      "../shared/sidebar-routes.json",
      import.meta.url
    ).pathname;
    const sidebarRoutesContent = readFileSync(sidebarRoutesPath, "utf8");
    const sidebarRoutes = JSON.parse(sidebarRoutesContent) as NavigationItem;

    if (DEBUG) {
      console.log("Creating directory index from sidebar routes");
      if (currentRoute) {
        console.log(`Current route: ${currentRoute}`);
      }
    }

    // Find the relevant subtree based on the current route
    let relevantItems = sidebarRoutes.children;

    if (currentRoute) {
      // Find the navigation item that matches or contains the current route
      const findRelevantSubtree = (
        items: NavigationItem[],
        route: string
      ): NavigationItem[] => {
        // First check for exact match
        const exactMatch = items.find((item) => item.route === route);
        if (
          exactMatch &&
          exactMatch.children &&
          exactMatch.children.length > 0
        ) {
          return exactMatch.children;
        }

        // Then check for parent routes
        for (const item of items) {
          if (item.route && route.startsWith(item.route + "/")) {
            if (item.children && item.children.length > 0) {
              const childResult = findRelevantSubtree(item.children, route);
              if (childResult.length > 0) {
                return childResult;
              }
              // If we found a parent but no exact child match, use this parent's children
              return item.children;
            }
          }
        }

        return items; // Default to the provided items if no match found
      };

      const foundItems = findRelevantSubtree(
        sidebarRoutes.children,
        currentRoute
      );
      /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */
      if (foundItems && foundItems.length > 0) {
        relevantItems = foundItems;
        if (DEBUG) {
          console.log(
            `Found relevant subtree with ${relevantItems.length} items`
          );
        }
      }
    }

    // Add the CSS link to the head for spectrum cards
    visit(ast, "element", (node) => {
      if (node.tagName === "head") {
        const linkElement: ElementContent = {
          type: "element",
          tagName: "link",
          properties: {
            rel: "stylesheet",
            href: "/styles/DirectoryIndex.css",
          },
          children: [],
        };
        node.children.push(linkElement);
      }
    });

    // Create the directory index cards
    const createCards = (items: NavigationItem[]): ElementContent[] => {
      return items
        .filter((item) => item.title && item.route)
        .map((item) => {
          // Create card element
          return h("div.spectrum-Card.spectrum-Card--quiet.directory-card", [
            h("div.spectrum-Card-body", [
              h("div.spectrum-Card-header", [
                h("div.spectrum-Card-title", [
                  h("div.spectrum-Card-image", [
                    h("iconify-icon", { icon: "lucide:book-up" }),
                  ]),
                  h("div.spectrum-Card-titleContent", [
                    h("a", { href: item.route }, item.title),
                  ]),
                ]),
              ]),
              item.children.length > 0
                ? h("div.spectrum-Card-content", [
                    h(
                      "p",
                      `Contains ${item.children.length} sub-${item.children.length === 1 ? "section" : "sections"}`
                    ),
                  ])
                : h("div.spectrum-Card-content", [h("p", "End page")]),
            ]),
          ]);
        });
    };

    // Replace the directory-index placeholder with the cards
    visit(ast, "element", (node, index, parent) => {
      if (node.tagName === "directory-index" && parent && index !== undefined) {
        const cardContainer = h(
          "div.directory-index-container",
          createCards(relevantItems)
        );

        parent.children.splice(index, 1, cardContainer);
      }
    });

    // Also check for text nodes containing the placeholder
    visit(ast, "element", (node) => {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (
          child.type === "text" &&
          child.value &&
          child.value.includes("<directory-index>")
        ) {
          // Split the text and insert the cards
          const parts = child.value.split("<directory-index>");

          const newChildren: ElementContent[] = [];
          if (parts[0])
            newChildren.push({
              type: "text",
              value: parts[0],
            } as ElementContent);

          newChildren.push(
            h("div.directory-index-container", createCards(relevantItems))
          );

          if (parts[1])
            newChildren.push({
              type: "text",
              value: parts[1],
            } as ElementContent);

          node.children.splice(i, 1, ...newChildren);
          break;
        }
      }
    });

    // Add CSS styles for the directory index
    visit(ast, "element", (node) => {
      if (node.tagName === "head") {
        const styleElement: ElementContent = {
          type: "element",
          tagName: "style",
          properties: {},
          children: [
            {
              type: "text",
              value: `
              .directory-index-container {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 1rem;
                margin: 1rem 0;
              }
              .directory-card {
                height: 100%;
                transition: transform 0.2s ease-in-out;
              }
              .directory-card:hover {
                transform: translateY(-5px);
              }
              .spectrum-Card-image iconify-icon {
                font-size: 24px;
                color: var(--spectrum-global-color-blue-500);
              }
            `,
            } as ElementContent,
          ],
        };
        node.children.push(styleElement);
      }
      return true; // Continue traversal
    });
  } catch (error) {
    console.error("Error creating directory index:", error);
  }
};
