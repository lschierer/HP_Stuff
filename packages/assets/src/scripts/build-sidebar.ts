import * as fs from "node:fs";
import * as path from "node:path";
import matter from "gray-matter";
import debugFunction from "@shared/debug";
import { type NavigationItem } from "@hp-stuff/schemas";

const DEBUG = debugFunction(new URL(import.meta.url).pathname);
const pagesRoot = path.join(process.cwd(), "./pages");
const ignoredFiles = [".gitignore", ".gitkeep"];

const pathToRoute = (fullPath: string) => {
  const cleanRoute = fullPath
    .replace(pagesRoot, "") //remove the extra levels of directory tree
    .replace(/\\/g, "/") // normalize the slashes for forward slashes
    .replace(/index\.md$/, "/") //remove any index.md segments
    .replace(/\.md$/, "/") //ensure we end in a slash
    .replace(/\/?$/, "/") //double check we end in a slash if a directory is passed in instead of a file
    .trim(); //no extra white space
  if (DEBUG) {
    console.log(`transformed ${fullPath} to ${cleanRoute}`);
  }
  return cleanRoute;
};
export const buildNavigationTree = (
  dir: string = pagesRoot
): NavigationItem => {
  const node: NavigationItem = {
    title: path.basename(dir),
    route: pathToRoute(dir),
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
          route: pathToRoute(fullPath),
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

      node.children.push({
        title: (data.title as string) || path.basename(entry, ".md"),
        route: pathToRoute(fullPath),
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
