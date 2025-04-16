"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildNavigationTree = void 0;
var fs = require("node:fs");
var path = require("node:path");
var gray_matter_1 = require("gray-matter");
var debug_1 = require("@shared/debug");
var DEBUG = (0, debug_1.default)(new URL(import.meta.url).pathname);
var pagesRoot = path.join(process.cwd(), "./pages");
var ignoredFiles = [".gitignore", ".gitkeep"];
var buildNavigationTree = function (dir) {
  if (dir === void 0) {
    dir = pagesRoot;
  }
  var node = {
    title: path.basename(dir),
    route: "",
    fileName: "",
    children: [],
  };
  if (!fs.existsSync(dir)) {
    if (DEBUG) console.warn("Directory ".concat(dir, " does not exist."));
    return node;
  }
  var entries = fs.readdirSync(dir);
  for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
    var entry = entries_1[_i];
    if (ignoredFiles.includes(entry)) continue;
    var fullPath = path.join(dir, entry);
    var stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      var indexPath = path.join(fullPath, "index.md");
      if (fs.existsSync(indexPath)) {
        // ✅ Parse frontmatter from index.md
        var content = fs.readFileSync(indexPath, "utf8");
        var data = (0, gray_matter_1.default)(content).data;
        var tmpNode = (0, exports.buildNavigationTree)(fullPath);
        node.children.push({
          title: data.title || path.basename(fullPath),
          route: fullPath.replace(pagesRoot, "").replace(/\\/g, "/"), // ends in /
          fileName: indexPath,
          children: tmpNode.children,
        });
      } else {
        var childNode = (0, exports.buildNavigationTree)(fullPath);
        node.children.push(childNode);
      }
    } else {
      if (
        path.basename(fullPath, ".md").startsWith("index") ||
        path.basename(fullPath, ".html").startsWith("index")
      ) {
        continue;
      }
      var content = fs.readFileSync(fullPath, "utf8");
      var data = (0, gray_matter_1.default)(content).data;
      var relativePath = fullPath.replace(pagesRoot, "").replace(/\\/g, "/");
      var cleanHref = relativePath
        .replace(/index\.md$/, "") // remove index.md
        .replace(/\.md$/, "") // remove .md
        .replace(/\/$/, ""); // remove trailing slash
      node.children.push({
        title: data.title || path.basename(entry, ".md"),
        route: cleanHref,
        fileName: fullPath,
        children: [],
      });
    }
  }
  return node;
};
exports.buildNavigationTree = buildNavigationTree;
var navigationTree = (0, exports.buildNavigationTree)();
if (DEBUG) {
  console.log(
    "Generated navigation tree:",
    JSON.stringify(navigationTree, null, 2)
  );
}
fs.writeFileSync(
  path.join(process.cwd(), "./dist/routes/sidebar-routes.json"),
  JSON.stringify(navigationTree, null, 2)
);
