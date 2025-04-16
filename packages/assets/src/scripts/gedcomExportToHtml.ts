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

import * as path from "node:path";
import * as fs from "node:fs";

import debugFunction from "@shared/debug";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
console.log(
  `DEBUG is set to ${DEBUG} for ${new URL(import.meta.url).pathname}`
);

const finalOutputDir = path.join(process.cwd(), "dist/Harrypedia/people");
const markdownPagesDir = path.join(process.cwd(), "pages/Harrypedia/people");
const staticContent = path.join(process.cwd(), "people");

import { doConversion } from "./transform_potter_data";

const pagesCreated = doConversion(markdownPagesDir, staticContent);

if (DEBUG) {
  console.log(`conversion created: \n${pagesCreated.join("\n")}`);
}
const filesCreatedDir = path.join(process.cwd(), "dist/filescreated");
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

if (!fs.existsSync(finalOutputDir)) {
  fs.mkdirSync(finalOutputDir, {
    recursive: true,
    mode: 0o755,
  });
}
