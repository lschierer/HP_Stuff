import { GedcomPerson } from "../schemas/gedcom";

// scripts/genPeoplePages.ts
import * as fs from "fs/promises";
import * as path from "path";
import { getGrampsData } from "../src/components/grampsParser/state";

async function generatePages() {
  const people = await getGrampsData();
  for (const person of people) {
    const html = buildPersonHTML(person);
    const outputPath = path.join("dist/people", `${person.id}.html`);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, html, "utf8");
  }
}

generatePages().catch(console.error);

const buildPersonHTML = (person: GedcomPerson.GedcomElement): string => {
  return `
    <html>
      <head><title>${person.name}</title></head>
      <body>
        <h1>${person.name}</h1>
        <p>Born: ${person.birth?.date}</p>
        <p>ID: ${person.id}</p>
      </body>
    </html>
  `;
};
export default buildPersonHTML;
