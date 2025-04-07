import type { SourcePlugin, ExternalSourcePage } from "@greenwood/cli";
import * as fs from "fs";

import { pathToFileURL } from "url";

import debugFunction from "../lib/debug.ts";

import markdownTextProcessing from "../lib/customMarkdownProcessing.ts";

const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

import { type GedcomPerson } from "../schemas/gedcom/index.ts";

import {
  GrampsState,
  findBirthLastName,
  familyPagesCreated,
  getGrampsData,
} from "../components/grampsParser/state.ts";

const personBody = (
  person: GedcomPerson.GedcomElement,
  route: string,
  fullPage: boolean = false
) => {
  if (DEBUG) {
    console.log(`body function for ${person.id}`);
  }
  let returnable = "";
  const basePath = `${process.cwd()}/../../assets/people/`;

  if (DEBUG) {
    returnable += `
      <span class="debug">fragment for ${person.id}</span>
    `;
  }

  if (fullPage) {
    const siteSection = "/Harrypedia/people/";
    const myPath = `${basePath}${route.slice(siteSection.length, -1)}.md`;
    const myPathUrl = pathToFileURL(myPath);
    if (DEBUG) {
      console.log(`looking for file ${myPath}, ${myPathUrl.toString()}`);
    }

    if (fs.existsSync(myPath)) {
      const fileText = fs.readFileSync(myPathUrl, "utf8");
      returnable += markdownTextProcessing(fileText);
    } else {
      returnable += DEBUG
        ? `<span class="debug">body for ${person.id}</span>`
        : `<span class="spectrum-Body spectrum-Body--serif">This is a placeholder page</span>`;
    }

    returnable = `
      <div class="bio">
        <person-section
          grampsId="${person.id}"
          ></person-section>
      </div>
      <div class="content">
        <h3 class="spectrum-Heading spectrum-Heading--serif spectrum-Heading--heavy spectrum-Heading--sizeL">Facts</h3>
        ${returnable}
      </div>
    `;
  } else {
    returnable += `
        <gramps-individual
          personid="${person.id}"
        ></gramps-individual>
      `;
  }
  return returnable;
};

export const GedcomSourcePlugin = (): SourcePlugin => {
  return {
    type: "source",
    name: "source-plugin-external-gedcom-pages",
    provider: (): (() => Promise<ExternalSourcePage[]>) => {
      return async function () {
        const returnPages = new Array<ExternalSourcePage>();
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
            console.log(`successful parse`);
          }

          for (const [key, person] of GrampsState.people) {
            if (DEBUG) {
              console.log(`inspecting ${key}`);
            }
            const first_name = person.primary_name.first_name;
            const last_name = findBirthLastName(person);
            const last_name_link = findBirthLastName(person, true);
            if (!familyPagesCreated.has(last_name)) {
              familyPagesCreated.add(last_name);
              const bp: ExternalSourcePage = {
                id: last_name,

                title: last_name,
                label: `External-${last_name.replaceAll(" ", "_")}-fragment`,
                layout: "standard",
                imports: [
                  '/components/grampsParser/FamilyPageSection.ts type="module"',
                ],
                route: `/Harrypedia/people/${last_name_link}/`,
                collection: "Harrypedia",
                body: `
                  <family-section
                    familyName="${last_name}"
                  ></family-section>
                  <span class="spectrum-Body spectrum-Body--serif">Placeholder page for ${last_name}</span>
                `,
                data: {
                  families: last_name,
                  order: "1",
                },
              };
              returnPages.push(bp);
            }

            const suffix = person.primary_name.suffix;
            const name = `${first_name} ${last_name} ${suffix}`;

            let BackupPersonRoute = `/Harrypedia/people/${last_name_link.length ? last_name_link : "Unknown"}/`;
            if (first_name.length) {
              BackupPersonRoute += `${first_name}${suffix.length > 0 ? ` ${suffix}` : ""}/`;
            } else {
              BackupPersonRoute += `${person.id}/`;
            }
            const bp: ExternalSourcePage = {
              id: person.id,
              layout: "standard",
              imports: [
                '/components/grampsParser/PersonPageSection.ts type="module"',
              ],
              collection: ["people", "Harrypedia", last_name],
              title: name,
              body: personBody(person, BackupPersonRoute, true),
              route: BackupPersonRoute,
              label: `External-${name.replaceAll(" ", "_")}`,
              data: {
                grampsID: person.id,
              },
            };
            returnPages.push(bp);
          }
        }
        return returnPages;
      };
    },
  };
};
