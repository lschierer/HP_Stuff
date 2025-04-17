import { fromHtml } from "hast-util-from-html";
import type { Root, Element } from "hast";
import { visit } from "unist-util-visit";
import debugFunction from "@shared/debug";
import sidebarRoutes from "@shared/sidebar-routes.json";

import { NavigationItem } from "@hp-stuff/schemas";

const DEBUG = debugFunction(new URL(import.meta.url).pathname);

export default class SidebarSection {
  accessor route: string = "";

  intercept(tree: Root): Root {
    const navElement = this.findNavPlaceholder(tree);
    if (!navElement) {
      if (DEBUG) console.warn("Sidebar: No .nav element found in AST.");
      return tree;
    }

    const valid = NavigationItem.safeParse(sidebarRoutes);
    let html = "";
    if (valid.success) {
      html = this.buildSidebarHtml(valid.data);
    } else {
      if (DEBUG) {
        console.error(valid.error.message);
      }
    }

    const sidebarAst = fromHtml(html, { fragment: true });

    const en = sidebarAst.children.filter((child) => child.type === "element");
    navElement.children = en;
    return tree;
  }

  private findNavPlaceholder(ast: Root): Element | null {
    let found: Element | null = null;
    visit(ast, "element", (node) => {
      if (
        node.tagName === "div" &&
        Array.isArray(node.properties.className) &&
        node.properties.className.includes("nav")
      ) {
        found = node;
      }
    });
    return found;
  }

  private buildSidebarHtml(tree: NavigationItem): string {
    const currentHref = this.route;
    if (DEBUG) {
      console.log(`building sidebar with route ${this.route}`);
    }

    const render = (node: NavigationItem): string => {
      if (DEBUG) {
        console.log(
          `render for node ${node.route ? node.route : node.title ? `title: ${node.title}` : "untitled"} `
        );
      }

      const isSelected = node.route === currentHref;
      const label = node.route
        ? `<a href="${node.route}" class="spectrum-SideNav-itemLink">${node.title}</a>`
        : `<span class="spectrum-SideNav-itemLink">${node.title}</span>`;
      if (node.children.length) {
        if (node.route && node.route.length) {
          if (this.route.startsWith(node.route)) {
            node.expanded = true;
          }
        }
        for (const child of node.children) {
          if (child.route && child.route.length > 1) {
            if (this.route.startsWith(child.route)) {
              child.expanded = true;
              node.expanded = true;
            }
          }
        }
      }
      const children =
        node.children.length && node.expanded
          ? `<ul class="spectrum-SideNav spectrum-SideNav--multiLevel">${node.children.map(render).join("")}</ul>`
          : "";

      return `<li class="spectrum-SideNav-item ${isSelected ? " is-selected" : ""}">${label}${children}</li>`;
    };

    return `
      <script type="module">
        import "/components/Spectrum/SplitView.ts"
      </script>
      <nav class="spectrum-SideNav"><ul class="spectrum-SideNav spectrum-SideNav--multiLevel">${tree.children.map(render).join("")}</ul></nav>
    `;
  }
}
