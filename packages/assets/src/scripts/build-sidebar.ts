import * as fs from "node:fs";
import * as path from "node:path";
import matter from "gray-matter";
import debugFunction from "@shared/debug";
import { type NavigationItem } from "@hp-stuff/schemas";

const DEBUG = debugFunction(new URL(import.meta.url).pathname);
const pagesRoot = path.join(process.cwd(), "./pages");
const ignoredFiles = [".gitignore", ".gitkeep"];

export const buildNavigationTree = (
  dir: string = pagesRoot
): NavigationItem => {
  const node: NavigationItem = {
    title: path.basename(dir),
    route: "",
    fileName: "",
    children: [],
  };

  if (!fs.existsSync(dir)) {
    if (DEBUG) console.warn(`Directory ${dir} does not exist.`);
    return node;
  }

  const entries = fs.readdirSync(dir);

  for (const entry of entries) {
    if (ignoredFiles.includes(entry)) continue;

    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const indexPath = path.join(fullPath, "index.md");
      if (fs.existsSync(indexPath)) {
        // ✅ Parse frontmatter from index.md
        const content = fs.readFileSync(indexPath, "utf8");
        const { data } = matter(content);
        const tmpNode = buildNavigationTree(fullPath);
        node.children.push({
          title: (data.title as string) || path.basename(fullPath),
          route: fullPath.replace(pagesRoot, "").replace(/\\/g, "/"), // ends in /
          fileName: indexPath,
          children: tmpNode.children,
        });
      } else {
        const childNode = buildNavigationTree(fullPath);
        node.children.push(childNode);
      }
    } else {
      if (
        path.basename(fullPath, ".md").startsWith("index") ||
        path.basename(fullPath, ".html").startsWith("index")
      ) {
        continue;
      }
      const content = fs.readFileSync(fullPath, "utf8");
      const { data } = matter(content);

      const relativePath = fullPath.replace(pagesRoot, "").replace(/\\/g, "/");
      const cleanHref = relativePath
        .replace(/index\.md$/, "/") // remove index.md
        .replace(/\.md$/, "/") // remove .md
        .endsWith("/")
        ? +""
        : +"/";

      node.children.push({
        title: (data.title as string) || path.basename(entry, ".md"),
        route: cleanHref,
        fileName: fullPath,
        children: [],
      });
    }
  }

  return node;
};

const navigationTree = buildNavigationTree();

if (DEBUG) {
  console.log(
    "Generated navigation tree:",
    JSON.stringify(navigationTree, null, 2)
  );
}

fs.writeFileSync(
  path.join(process.cwd(), "./src/shared/sidebar-routes.json"),
  JSON.stringify(navigationTree, null, 2)
);
