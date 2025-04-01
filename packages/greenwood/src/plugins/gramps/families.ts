import type { SourcePlugin, ExternalSourcePage } from "@greenwood/cli";

import debugFunction from "../../lib/debug.ts";

const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

import {
  GrampsState,
  getGrampsData,
  familyPagesCreated,
  findBirthLastName,
} from "../../components/grampsParser/state.ts";

const body = (lastname: string) => {
  if (DEBUG) {
    console.log(`body function for ${lastname}`);
  }
  let returnable = "";
  if (DEBUG) {
    returnable += `
      <span class="debug">fragment for ${lastname}</span>
    `;
  }
  returnable += `
      <family-listing
        familyname="${lastname}"
        showHeading
      ></family-listing>
    `;
  return returnable;
};

export const GedcomFamilySourcePlugin = (): SourcePlugin => {
  return {
    type: "source",
    name: "source-plugin-external-family-page",
    provider: (): (() => Promise<ExternalSourcePage[]>) => {
      return async function () {
        const returnPages = new Array<ExternalSourcePage>();
        await getGrampsData();

        if (GrampsState.people.size) {
          for (const [key, person] of GrampsState.people) {
            if (DEBUG) {
              console.log(`inspecting ${key}`);
            }

            const lastname = findBirthLastName(person);
            const lastname_link = findBirthLastName(person, true);
            if (!familyPagesCreated.has(lastname)) {
              familyPagesCreated.add(lastname);

              const fp: ExternalSourcePage = {
                id: lastname,
                title: lastname,
                label: `External-${lastname}-fragment`,
                route: `/api/gramps/families/${lastname_link.replaceAll(" ", "_")}`,
                body: body(lastname),
                data: {},
              };
              returnPages.push(fp);

              const bp: ExternalSourcePage = {
                id: lastname,

                title: lastname,
                label: `External-${lastname}-fragment`,
                route: `/Harrypedia/people/${lastname_link.replaceAll(" ", "_")}/`,
                collection: "Harrypedia",
                body: `<span class="debug">Placeholder page for ${lastname}</span>`,
                data: {
                  families: lastname,
                  order: "1",
                },
              };
              returnPages.push(bp);
            }
          }
        }
        return returnPages;
      };
    },
  };
};
