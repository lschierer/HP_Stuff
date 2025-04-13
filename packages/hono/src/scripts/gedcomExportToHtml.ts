import * as fs from "node:fs";
import * as path from "node:path";
import yaml from "js-yaml";

import debugFunction from "@shared/debug";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);

import { type NavigationItem } from "@schemas/page";
import { GrampsState, getGrampsData } from "@shared/gedcom/state";
import IndividualName from "@shared/gedcom/IndividualName";

const staticPersonFiles = path.join(process.cwd(), "../../assets/people");

const doConversion = async () => {
  const returnPages = new Array<NavigationItem>();
  await getGrampsData();
  if (!GrampsState.people.size) {
    if (DEBUG) {
      console.log(
        `failed to set GrampsState for provider anon in GedcomPeopleSourcePlugin`
      );
    }
    throw new Error(`failed to populate GrampsState.people`);
  } else {
    if (DEBUG) {
      console.log(`GrampsState has ${GrampsState.people.size} people`);
    }
    for (const [key, person] of GrampsState.people) {
      if (DEBUG) {
        console.log(`building route for ${key}`);
      }

      const pId = person.id;

      const individualName = new IndividualName(pId);
      const routePath = individualName.buildLinkTarget();
      const staticPath = path.join(
        staticPersonFiles,
        path.dirname(routePath.replace("/Harrypedia/people", "")),
        `${path.basename(routePath)}.md`
      );
      if (DEBUG) {
        console.log(`staticPath is '${staticPath}' for ${routePath}`);
      }
      let pageContent = "";
      pageContent += "---\n";
      pageContent += `title: ${individualName.displayName()}\n`;
      pageContent += `collection: \n  - Harrypedia\n  - gedcom\n  - ${individualName.lastName()}\n`;
      pageContent += `${yaml.dump({ gedcom: person }).trim()}\n`;
      pageContent += "---\n";
      if (fs.existsSync(staticPath)) {
        try {
          pageContent += fs.readFileSync(staticPath, "utf-8");
        } catch (err) {
          if (DEBUG) {
            console.error(
              `error reading file for ${staticPath}: ${JSON.stringify(err)}`
            );
          }
        }
      }
      const outputDir = path.join(
        process.cwd(),
        "src/Pages/",
        path.dirname(routePath)
      );
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, {
          recursive: true,
          mode: 0o750,
        });
      }
      const fullOutput = path.join(outputDir, `${path.basename(routePath)}.md`);
      fs.writeFileSync(fullOutput, pageContent, {
        mode: 0o640,
        encoding: "utf-8",
        flag: "w",
      });
      const ni: NavigationItem = {
        title: individualName.displayName(),
        route: routePath,
        html: pageContent,
        children: [],
      };
      returnPages.push(ni);
    }
  }
  const routedir = path.join(process.cwd(), "src/shared/routes");
  if (!fs.existsSync(routedir)) {
    fs.mkdirSync(routedir, {
      recursive: true,
      mode: 0o750,
    });
  }
  const routeFile = path.join(routedir, "gedcomroutes.json");
  fs.writeFileSync(routeFile, JSON.stringify(returnPages, null, 2));
};

await doConversion();
