import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { ElementContent, Root } from "hast";
import { z } from "zod";
import matter from "gray-matter";
import { h } from "hastscript";
import process from "node:process";

import TopHeaderSection from "./TopHeader";
import FooterHeaderSection from "./FooterSection";

import { parseHtmlToHast, parseMarkdownToHast } from "./parseToHast";

import SideBarRoutesImport from "@shared/sidebar-routes.json";

//central control over whether or not to output debugging
import debugFunction from "@shared/debug";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);

import {
  FrontMatter,
  ParsedResult,
  NavigationItem,
  LayoutOptions,
} from "@hp-stuff/schemas";
import SidebarSection from "./SidebarSection";

/**
 * Check if a route is a family index page
 * @param route The route to check
 * @returns True if the route is a family index page
 */
const isFamilyIndexPage = (route: string): boolean => {
  const routeParts: (string | undefined)[] = route.split("/");
  // Check if the route matches /Harrypedia/people/<lastname>/index
  // or /Harrypedia/people/<lastname>/ (which resolves to index)
  const pwdParts = process.cwd().split("/").length;
  const result =
    routeParts.length > pwdParts &&
    routeParts[pwdParts + 1] === "Harrypedia" &&
    routeParts[pwdParts + 2] === "people" &&
    (routeParts[pwdParts + 4] === "index" ||
      routeParts[pwdParts + 4] === undefined ||
      routeParts[pwdParts + 4] === "");
  if (DEBUG) {
    if (!result && routeParts.length >= pwdParts) {
      console.log(`4th routeParts is ${routeParts[pwdParts + 4]}`);
    }
    console.log(`${route} ${result ? "is" : "is not"} a family index page`);
  }
  return result;
};

/**
 * Check if a page contains the directory-index placeholder
 * @param ast The AST to check
 * @returns True if the page contains the directory-index placeholder
 */
const hasDirectoryIndexPlaceholder = (ast: Root): boolean => {
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
const createDirectoryIndex = (ast: Root, currentRoute?: string): void => {
  try {
    // Read the sidebar-routes.json file

    let sidebarRoutes: NavigationItem | null = null;
    console.debug(
      "[DEBUG] sidebar-routes import:",
      JSON.stringify(SideBarRoutesImport, null, 2)
    );
    const valid = NavigationItem.safeParse(SideBarRoutesImport);
    if (valid.success) {
      sidebarRoutes = valid.data;
    } else {
      console.error(valid.error);
      return;
    }

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

/**
 * Modify the AST for family index pages
 * - Add the FamilyListing.css stylesheet
 * - Add the familylisting class to the first ul element
 * @param ast The AST to modify
 */
const modifyFamilyIndexPage = (ast: Root): void => {
  // Add the CSS link to the head
  visit(ast, "element", (node) => {
    if (node.tagName === "head") {
      const linkElement: ElementContent = {
        type: "element",
        tagName: "link",
        properties: {
          rel: "stylesheet",
          href: "/styles/FamilyListing.css",
        },
        children: [],
      };
      node.children.push(linkElement);
    }
  });

  // Add the familylisting class to the first ul element
  let foundFirstUl = false;
  visit(ast, "element", (node) => {
    if (node.tagName === "ul" && !foundFirstUl) {
      foundFirstUl = true;

      if (!node.properties.className) {
        node.properties.className = ["familylisting"];
      } else if (Array.isArray(node.properties.className)) {
        node.properties.className.push("familylisting");
      } else {
        node.properties.className = [
          node.properties.className as string,
          "familylisting",
        ];
      }
    }
  });
};

const processHtml = async (
  options: LayoutOptions,
  template?: string
): Promise<ParsedResult> => {
  let frontMatter: FrontMatter = {
    title: "",
  };
  try {
    let contentAst: Root;

    if ("markdownContent" in options) {
      if (DEBUG) {
        console.log(`building content from markdown string`);
      }

      const { data, content } = matter(options.markdownContent);

      const fileFM = FrontMatter.safeParse(data);
      if (fileFM.success) {
        frontMatter = fileFM.data;
      }
      if (DEBUG) {
        console.log(`Extracted frontmatter:`, JSON.stringify(fileFM.data));
      }

      contentAst = await parseMarkdownToHast(content);
    } else {
      if (DEBUG) {
        console.log(`building content from html string`);
      }
      // Extract front matter using gray-matter
      const { data: rawFrontmatter, content } = matter(options.content);

      // Parse frontmatter with Zod schema
      const fileFM = FrontMatter.safeParse(rawFrontmatter);
      if (fileFM.success) {
        frontMatter = fileFM.data;
      }

      contentAst = parseHtmlToHast(content);
    }

    const contentChildren = contentAst.children;

    if (template === undefined) {
      options.title = frontMatter.title;
      template = getTemplate(options);
    }

    const ast = unified().use(rehypeParse).parse(template);

    visit(ast, "element", (node, index, parent) => {
      if (
        node.tagName === "page-outlet" &&
        parent &&
        Array.isArray(parent.children)
      ) {
        const outletIndex = parent.children.indexOf(node);
        if (outletIndex !== -1) {
          parent.children.splice(outletIndex, 1, ...contentChildren);
        }
      }
    });

    // Check if this is a family index page and modify the content accordingly
    if (options.route && isFamilyIndexPage(options.route)) {
      if (DEBUG) {
        console.log(`Detected family index page: ${options.route}`);
      }
      modifyFamilyIndexPage(ast);
    }

    // Check if the page contains a directory index placeholder
    // First check the raw content for the placeholder
    let hasDirectoryIndex = false;
    if (
      "markdownContent" in options &&
      options.markdownContent.includes("<directory-index>")
    ) {
      hasDirectoryIndex = true;
      if (DEBUG) {
        console.log(`Detected directory index placeholder in raw markdown`);
      }

      // For markdown content, we need to manually insert the directory index
      // since the markdown processor might strip the custom HTML tag
      visit(ast, "element", (node) => {
        if (node.tagName === "main") {
          // Create a simple placeholder that createDirectoryIndex will find
          const placeholder = h("directory-index");

          // Add it to the main content
          node.children.push(placeholder);
          return false; // Stop traversal
        }
        return true; // Continue traversal
      });
    } else if (
      "content" in options &&
      options.content.includes("<directory-index>")
    ) {
      hasDirectoryIndex = true;
      if (DEBUG) {
        console.log(`Detected directory index placeholder in raw HTML`);
      }
    } else {
      // Then check the AST
      hasDirectoryIndex = hasDirectoryIndexPlaceholder(ast);
    }

    if (hasDirectoryIndex) {
      if (DEBUG) {
        console.log(`Creating directory index`);
      }
      createDirectoryIndex(ast, options.route);
    }

    const topHeader = new TopHeaderSection();
    const footerSection = new FooterHeaderSection();
    const sidebarSection = new SidebarSection();
    if (options.route && Object.keys(SideBarRoutesImport).length) {
      topHeader.route = options.route;
      sidebarSection.route = options.route;
    }
    topHeader.intercept(ast);
    await footerSection.intercept(ast);
    if (options.sidebar) {
      sidebarSection.intercept(ast);
    }
    return {
      frontMatter,
      html: unified().use(rehypeStringify).stringify(ast),
    } as ParsedResult;
  } catch (err) {
    if (DEBUG) console.error("Layout render error:", err);
    return {
      frontMatter,
      html: `<html><body><h1>Error rendering page</h1><pre>${JSON.stringify(err)}</pre></body></html>`,
    } as ParsedResult;
  }
};

// default template for my site
const getTemplate = (options: LayoutOptions) => {
  const isMarkdown = "markdownContent" in options;
  const isSplash = !isMarkdown || options.route === "/" || !options.sidebar;
  const useStandard = (isMarkdown && !isSplash) || options.sidebar;
  if (DEBUG) {
    console.log(
      `getTemplate: isMarkdown: ${isMarkdown}; isSplash: ${isSplash}; useStandard: ${useStandard}`
    );
  }
  return `
    <!doctype html>
    <html lang="en" class="spectrum spectrum-Typography">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>
          Luke's HP Site${options.title.length ? ` - ${options.title}` : ""}
        </title>
        <meta name="description" content="Luke's Harry Potter Fan Site" />
        <link rel="stylesheet" href="/styles/global.css" />
        <link rel="stylesheet" href="/styles/${useStandard ? "standard.css" : "splash.css"}" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link
          href="https://fonts.googleapis.com/css2?family=Inconsolata:wght@200..900&family=Micro+5&display=swap"
          rel="stylesheet"
        />
        ${
          process.env.NODE_ENV === "production"
            ? `
        <script
          type="module"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8360834774752607"
        ></script>
        `
            : ""
        }

        <meta name="google-adsense-account" content="ca-pub-8360834774752607" />

        <script type="module" src="/components/Spectrum/Base.ts"></script>

      </head>
      <body>

        <sp-theme class="spectrum-Typography">
          <header>
            <div class="topHeader" ></div>
            <theme-provider></theme-provider>
          </header>

          ${
            useStandard
              ? `
            <div class="title-section">
              <h1 class="spectrum-Heading spectrum-Heading--sizeXXL">
                ${options.title}
              </h1>
            </div>
            <sp-split-view resizable primary-size="20%">
            <div class="nav"></div>
            <div class="main">
              <main>
                <page-outlet></page-outlet>
              </main>
            </div>
            </sp-split-view>
          `
              : `
            <page-outlet></page-outlet>
          `
          }

          <footer class="footer">
            <span
              id="copyright"
              class="copyright spectrum-Detail spectrum-Detail--serif spectrum-Detail--sizeM spectrum-Detail--light"
            >
              COPYRIGHTPLACEHOLDER
            </span>
          </footer>

        </sp-theme>
      </body>
    </html>
  `;
};

export const renderLayout = async (options: LayoutOptions): Promise<ParsedResult> => {
  if (DEBUG) {
    console.log(`in layout.ts renderLayout`);
  }
  if (options.route && options.route.length > 1) {
    options.sidebar = true;
  }
  return await processHtml(options);
};
