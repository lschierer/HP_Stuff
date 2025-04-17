/*
  I need to do several things:

  1. For each person in persons I need to create a markdown page in outputDir
     1.1 This markdown page will go in `${outputDir}/${lastname}/${firstname} ${suffix}.md`
     1.2 The directory `${outputDir}/${lastname}` may not exist yet. the script may need to create it.
     1.3 If ${lastname} == 'Unknown' then the filename is `${outputDir}/Unknown/${firstname} - ${gramps_id}.md`
     1.4 If ${firstname} == 'Unknown' then the filename is `${outputDir}/${lastname}/${gramps_id}.md`
     1.5 if both ${lastname} and ${firstname} == 'Unknown' then the filename is  `${outputDir}/Unknown/${gramps_id}.md`
     1.6 Links in the generated markdown should be formatted using the formatUrlForMarkdown in this file
     1.7 if there is a file in ${staticContent} that corresponds to the final value of the output filename (with ${staticContent} substituted for ${outputDir}) then that should be appended to the output file under a markdown hr
  2. As each person is processed in #1 above, I need to keep track of the last names.
     2.1 For each last name, I need to create a nested list of members
     2.2 The list should reflect parent/child relationships.  the parent_family_list in the person itself tells you which family in families contains the parents of a given person.  In that family there is a father_handle and mother_handle attribute that corresponds to the handle attribute in a person in persons.
     2.3 If both mother and father have the same computed last name, the child should be nested under the father.
     2.4 an index.md page for each `${outputDir/${lastname}` should be created containing the resulting nested list.
     2.5 is a corresponding index.md page exists at ${staticContent}/${lastName} this should be appended to the generated one at ${outputDir}/${lastName}
  3. a file in ${process.cwd()}/dist/routes/ (the directory may need to be created) should be populated with the JSON.stringify() of returnPages from this function  this variable should be maintained in a hierarchical manner using the NavigationItem object's children array as pages are created.
  4. the IndividualName class should be used to obtain names and the text of link targets to provide uniformity
*/

import * as fs from "node:fs";
import { mkdirSync, writeFileSync } from "node:fs";
import * as path from "node:path";

import { ParsedResult } from "@hp-stuff/schemas";
import { buildNavigationTree } from "./build-sidebar";
import { defaultLayout } from "./transform/layout";
import { mdTohtml } from "./transform/mdTohtml";
import { doConversion } from "./transform_potter_data";

import debugFunction from "@shared/debug";

const DEBUG = debugFunction(new URL(import.meta.url).pathname);
console.warn(
  `DEBUG is set to ${DEBUG} for ${new URL(import.meta.url).pathname}`
);

const finalOutputDir = path.join(process.cwd(), "dist/");
const markdownPagesDir = path.join(process.cwd(), "pages");
const staticContent = path.join(process.cwd(), "people");
const gedcomPrefix = "Harrypedia/people";

function ensureDirectoryIndexes(root: string, outFile: string) {
  const created: string[] = [];
  const stack = [root];

  while (stack.length > 0) {
    const dir = stack.pop() ?? ".";
    const indexPath = path.join(dir, "index.md");

    if (!fs.existsSync(indexPath)) {
      const title = path.basename(dir);
      const content = `---\ntitle: ${title}\n---\n\n<directory-index></directory-index>\n`;
      writeFileSync(indexPath, content, "utf-8");
      created.push(indexPath);
    }

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        stack.push(path.join(dir, entry.name));
      }
    }
  }

  mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, created.join("\n"), "utf-8");
}

const navTree = () => {
  const navigationTree = buildNavigationTree();

  if (DEBUG) {
    console.warn(
      "Generated navigation tree:",
      JSON.stringify(navigationTree, null, 2)
    );
  }
  fs.writeFileSync(
    path.join(finalOutputDir, "routes/sidebar-routes.json"),
    JSON.stringify(navigationTree, null, 2)
  );
};

const getFiles = (basePath: string, filePath: string): string | string[] => {
  const node = path.join(basePath, filePath);
  const ns = fs.statSync(node);
  if (ns.isDirectory()) {
    const items = fs.readdirSync(node);
    const r: string | string[] = items
      .map((item) => {
        return getFiles(node, item);
      })
      .flat();
    return r;
  } else {
    return node;
  }
};

const pagesCreated = doConversion(
  path.join(markdownPagesDir, gedcomPrefix),
  staticContent
);

if (DEBUG) {
  console.warn(`conversion created: \n${pagesCreated.join("\n")}`);
}

const filesCreatedDir = path.join(finalOutputDir, "filescreated");
if (!fs.existsSync(filesCreatedDir)) {
  fs.mkdirSync(filesCreatedDir, {
    recursive: true,
    mode: 0o755,
  });
}

fs.writeFileSync(
  path.join(filesCreatedDir, "/gedcom.txt"),
  pagesCreated.join("\n"),
  {
    encoding: "utf-8",
  }
);

ensureDirectoryIndexes(
  markdownPagesDir,
  `${finalOutputDir}/filescreated/indexFiles.txt`
);
navTree();

if (!fs.existsSync(path.join(finalOutputDir, gedcomPrefix))) {
  fs.mkdirSync(path.join(finalOutputDir, gedcomPrefix), {
    recursive: true,
    mode: 0o755,
  });
}

const ignoredFiles = [".gitkeep", ".gitignore"];
for (const file of getFiles(markdownPagesDir, ".")) {
  if (ignoredFiles.includes(path.basename(file))) {
    continue;
  }

  const relativePath = file.replace(markdownPagesDir, "");
  if (DEBUG) {
    console.log(`relativePath is ${relativePath}`);
    console.log(`now processing ${relativePath}`);
  }

  let pr: ParsedResult | string | null = null;
  let basename = "";
  if (file.endsWith(".fragment.html")) {
    if (DEBUG) {
      console.log(`this is a fragment`);
    }
    basename = path.basename(relativePath, ".fragment.html");

    const data = fs.readFileSync(file, "utf-8");
    pr = await defaultLayout({
      title: "",
      route: `${path.dirname(relativePath)}${path.basename(relativePath, ".html")}`,
      content: data,
    });
  }

  if (file.endsWith(".md")) {
    if (DEBUG) {
      console.log(`this is a markdown file`);
    }
    basename = path.basename(relativePath, ".md");
    pr = await mdTohtml(file.slice(0, -3));
  }

  const location = path.join(finalOutputDir, path.dirname(relativePath));
  if (!fs.existsSync(location)) {
    fs.mkdirSync(location, {
      recursive: true,
      mode: 0o755,
    });
  }
  if (typeof pr === "string") {
    if (DEBUG) {
      console.log(`result for ${file} is a string at ${location}`);
    }
    fs.writeFileSync(`${location}/${basename}.html`, pr);
  } else if (ParsedResult.safeParse(pr).success) {
    if (DEBUG) {
      console.log(
        `result for ${file} is a ParsedResult at ${location}/${basename}.html`
      );
    }
    fs.writeFileSync(`${location}/${basename}.html`, (pr as ParsedResult).html);
  } else {
    if (DEBUG) {
      console.error(`unknown result type for ${location}/${basename}.html`);
    }
  }
}
navTree();
