import * as fs from "node:fs";
import { fromHtml } from "hast-util-from-html";
import type { Root, Element } from "hast";
import { visit } from "unist-util-visit";
import debugFunction from "@shared/debug";
import sidebarRoutes from "@shared/sidebar-routes.json";

const DEBUG = debugFunction(new URL(import.meta.url).pathname);

interface NavigationItem {
  title: string;
  href?: string;
  children?: NavigationItem[];
}

interface TreeNode extends NavigationItem {
  expanded?: boolean;
}

export default class SidebarSection {
  accessor route: string = "";

  intercept(tree: Root): Root {
    const navElement = this.findNavPlaceholder(tree);
    if (!navElement) {
      if (DEBUG) console.warn("Sidebar: No .nav element found in AST.");
      return tree;
    }

    const segments = this.route.split("/").filter(Boolean);
    const filtered = this.filterNavigation(sidebarRoutes, segments);

    if (!filtered || !filtered.children?.length) return tree;

    const html = this.buildSidebarHtml(filtered);
    const sidebarAst = fromHtml(html, { fragment: true });

    navElement.children = sidebarAst.children;
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

  private filterNavigation(tree: NavigationItem, segments: string[], depth = 0): TreeNode {
    const node: TreeNode = {
      title: tree.title,
      href: tree.href,
      children: [],
    };

    for (const child of tree.children || []) {
      const hrefPart = child.href?.split("/").pop();
      const isMatch = hrefPart && segments.includes(hrefPart);

      if (depth === 0) {
        const topNode = this.filterNavigation(child, segments, depth + 1);
        node.children!.push(topNode);
      } else if (isMatch) {
        const siblingNode = this.filterNavigation(child, segments, depth + 1);
        siblingNode.expanded = true;
        node.children!.push(siblingNode);
      } else if (child.children) {
        const nested = this.filterNavigation(child, segments, depth + 1);
        if (nested.children && nested.children.length > 0) {
          nested.expanded = true;
          node.children!.push(nested);
        }
      }
    }

    return node;
  }

  private buildSidebarHtml(tree: TreeNode): string {
    const currentHref = this.route;

    const render = (node: TreeNode): string => {
      const isSelected = node.href === currentHref;
      const label = node.href
        ? `<a href="${node.href}" class="spectrum-SideNav-itemLink${isSelected ? " is-selected" : ""}">${node.title}</a>`
        : `<span class="spectrum-SideNav-itemLink">${node.title}</span>`;

      const children = node.expanded && node.children?.length
        ? `<ul class="spectrum-SideNav">${node.children.map(render).join("")}</ul>`
        : "";

      return `<li class="spectrum-SideNav-item">${label}${children}</li>`;
    };

    return `<nav class="spectrum-SideNav"><ul class="spectrum-SideNav">${tree.children?.map(render).join("")}</ul></nav>`;
  }
}
