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
  findAnyLastName,
  familyPagesCreated,
  getGrampsData,
} from "../components/grampsParser/state.ts";

const redirectBody = (
  person: GedcomPerson.GedcomElement,
  targetRoute: string
) => {
  const returnable = `
    <head>
      <meta http-equiv="Refresh" content="0; URL=${targetRoute}" />
    </head>
    <body>
      <p>Redirecting to <a href="${targetRoute}">${targetRoute}</a></p>
    </body>
  `;
  if (DEBUG) {
    console.log(`redirect body for ${person.id} is ${returnable}`);
  }
  return returnable;
};

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
            const birth_last_name = findBirthLastName(person);
            const birth_last_name_link = findBirthLastName(person, true);

            // Use findAnyLastName to get a last name even if birth name is not available
            const any_last_name = findAnyLastName(person);
            const any_last_name_link = findAnyLastName(person, true);

            // Determine which last name to use for the page
            const last_name =
              birth_last_name !== "Unknown" ? birth_last_name : any_last_name;
            const last_name_link =
              birth_last_name !== "Unknown"
                ? birth_last_name_link
                : any_last_name_link;

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
                },
              };
              returnPages.push(bp);
            }

            const suffix = person.primary_name.suffix;
            const name = `${first_name} ${last_name} ${suffix}`;

            // Create the person route using the determined last name
            let personRoute = `/Harrypedia/people/${birth_last_name_link}/`;
            if (first_name.length) {
              personRoute += `${first_name}${suffix.length > 0 ? ` ${suffix}` : ""}/`;
            } else {
              personRoute += `${person.id}/`;
            }

            // Create the main person page
            const bp: ExternalSourcePage = {
              id: person.id,
              layout: "standard",
              imports: [
                '/components/grampsParser/PersonPageSection.ts type="module"',
              ],
              collection: ["people", "Harrypedia", last_name],
              title: name,
              body: personBody(person, personRoute, true),
              route: personRoute,
              label: `External-${name.replaceAll(" ", "_")}`,
              data: {
                grampsID: person.id,
              },
            };
            returnPages.push(bp);

            // If we're using a non-birth last name, create a redirect page at the birth name location
            if (birth_last_name === "Unknown" && any_last_name !== "Unknown") {
              // Create a redirect route using "Unknown" as the last name
              let redirectRoute = `/Harrypedia/people/${last_name_link}/`;
              if (first_name.length) {
                redirectRoute += `${first_name}${suffix.length > 0 ? ` ${suffix}` : ""}/`;
              } else {
                redirectRoute += `${person.id}/`;
              }

              // Create a redirect page
              const redirectPage: ExternalSourcePage = {
                id: `${person.id}-redirect`,
                layout: "standard",
                collection: ["people", "Harrypedia", "Unknown"],
                title: `Redirect for ${name}`,
                body: redirectBody(person, personRoute),
                route: redirectRoute,
                label: `External-Redirect-${name.replaceAll(" ", "_")}`,
                data: {
                  grampsID: person.id,
                  isRedirect: "true",
                },
              };
              returnPages.push(redirectPage);
            }
          }
        }
        return returnPages;
      };
    },
  };
};
