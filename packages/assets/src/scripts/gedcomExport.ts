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
import * as path from "node:path";

import { persons } from "./import_potter_data";
import { IndividualName } from "./IndividualName";
import { doConversion } from "./transform_potter_data";
import AncestorsTreeChart from "./TreeChart";

import debugFunction from "@shared/debug";

const DEBUG = debugFunction(new URL(import.meta.url).pathname);
console.warn(
  `DEBUG is set to ${DEBUG} for ${new URL(import.meta.url).pathname}`
);

const markdownPagesDir = path.join(process.cwd(), "pages");
const assetsDir = path.join(process.cwd(), "assets");
const staticContent = path.join(process.cwd(), "people");
const gedcomPrefix = "Harrypedia/people";
const finalDestinationDir = path.join(process.cwd(), "../greenwood/src/pages");

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

const svgTargetDir = path.join(assetsDir, gedcomPrefix);

if (!fs.existsSync(svgTargetDir)) {
  fs.mkdirSync(svgTargetDir, {
    recursive: true,
    mode: 0o755,
  });
}
if (!fs.existsSync(path.join(assetsDir, "filescreated"))) {
  fs.mkdirSync(path.join(assetsDir, "filescreated"), {
    recursive: true,
    mode: 0o755,
  });
}

const SVGsCreated = new Array<string>();

for (const person of persons) {
  const treeChart = new AncestorsTreeChart(person.gramps_id, 7, true);
  const svgData = await treeChart.printTree(gedcomPrefix);
  if (svgData.length) {
    const individualName = new IndividualName(person);
    const svgFileName = path.join(
      svgTargetDir,
      `${individualName.getFilename().slice(0, -3)}.svg`
    );
    console.log(`svgFileName is ${svgFileName}`);

    //the generated file name can introduce a lastName directory
    if (!fs.existsSync(path.dirname(svgFileName))) {
      fs.mkdirSync(path.dirname(svgFileName), {
        recursive: true,
        mode: 0o755,
      });
    }
    fs.writeFileSync(svgFileName, svgData, { encoding: "utf-8" });
    SVGsCreated.push(svgFileName);
  }
}

for (const f of getFiles(svgTargetDir, ".")) {
  const d = path
    .dirname(f)
    .replace(assetsDir, path.join(finalDestinationDir, "../assets"));

  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, {
      recursive: true,
      mode: 0o755,
    });
  }
  const target = path.join(d, path.basename(f));
  fs.copyFileSync(f, target);
  SVGsCreated.push(target);
}

fs.writeFileSync(
  path.join(assetsDir, "filescreated", `SVGsCreated.txt`),
  SVGsCreated.join("\n")
);

const pagesCreated = doConversion(
  path.join(markdownPagesDir, gedcomPrefix),
  staticContent,
  assetsDir
);

if (DEBUG) {
  console.warn(`conversion created: \n${pagesCreated.join("\n")}`);
}

for (const f of getFiles(path.join(markdownPagesDir, gedcomPrefix), ".")) {
  const d = path.dirname(f).replace(markdownPagesDir, finalDestinationDir);

  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, {
      recursive: true,
      mode: 0o755,
    });
  }
  const target = path.join(d, path.basename(f));
  fs.copyFileSync(f, target);
  pagesCreated.push(target);
}

// record what was created for the clean script

const filesCreatedDir = path.join(markdownPagesDir, "filescreated");
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
