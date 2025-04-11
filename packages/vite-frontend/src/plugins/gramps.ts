import debugFunction from "../lib/debug";

import { type PreviewServer } from "vite";

const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

import { type GedcomPerson } from "../schemas/gedcom";

// scripts/genPeoplePages.ts
import * as fs from "fs/promises";
import * as path from "path";
import { GrampsState, getGrampsData } from "../lib/grampsState";

async function generatePages() {
  await getGrampsData();

  for (const [key, person] of GrampsState.people) {
    if (DEBUG) {
      console.log(`building page for ${key}`);
    }
    const html = buildPersonHTML(person);
    const outputDir =
      import.meta.env.MODE === "serve" ? "public/people" : "dist/people";
    const outputPath = path.join(outputDir, `${person.id}.html`);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, html, "utf8");
  }
}

generatePages().catch(console.error);

const buildPersonHTML = (person: GedcomPerson.GedcomElement): string => {
  return `
    <html>
      <head><title>${person.id}</title></head>
      <body>
        <h1>${person.id}</h1>
      </body>
    </html>
  `;
};

const PluginProvider = () => {
  return {
    name: "vite-gramps-pages",

    async buildStart() {
      await generatePages();
    },
  };
};
export default PluginProvider;
