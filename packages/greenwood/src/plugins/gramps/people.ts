import type { SourcePlugin, ExternalSourcePage } from "@greenwood/cli";
import * as fs from "fs";

import debugFunction from "../../lib/debug.ts";

const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

import { type GedcomPerson } from "../../schemas/gedcom/index.ts";

import {
  GrampsState,
  findBirthLastName,
  getGrampsData,
} from "../../components/grampsParser/state.ts";

const body = (person: GedcomPerson.GedcomElement) => {
  if (DEBUG) {
    console.log(`body function for ${person.id}`);
  }
  let returnable = "";
  if (DEBUG) {
    returnable += `
      <span class="debug">fragment for ${person.id}</span>
    `;
  }
  returnable += `
      <gramps-individual
        personid="${person.id}"
      ></gramps-individual>
    `;
  return returnable;
};

export const GedcomPeopleSourcePlugin = (): SourcePlugin => {
  return {
    type: "source",
    name: "source-plugin-external-person-page",
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
            const last_name_link = findBirthLastName(person, true).replaceAll(
              " ",
              "_"
            );

            const suffix = person.primary_name.suffix;
            const name = `${first_name} ${last_name} ${suffix}`;
            const FragmentRoute = `/api/gramps/people/${person.id}`;

            const p: ExternalSourcePage = {
              id: person.id,
              title: name,
              body: body(person),
              route: FragmentRoute,
              label: `External-${name.replaceAll(" ", "_")}`,
              data: {
                grampsID: person.id,
              },
            };
            returnPages.push(p);

            let BackupPersonRoute = `/Harrypedia/people/${last_name_link.length ? last_name_link : "Unknown"}/`;
            if (first_name.length) {
              BackupPersonRoute += `${encodeURIComponent(first_name).replaceAll(
                " ",
                "_"
              )}${suffix.length > 0 ? `_${suffix}` : ""}/`;
            } else {
              BackupPersonRoute += `${person.id}/`;
            }
            const mdFile = `src/pages/${BackupPersonRoute.slice(0, -1)}.md`;
            if (!fs.existsSync(mdFile)) {
              console.log(`${mdFile} does not exist`);
              const bp: ExternalSourcePage = {
                id: person.id,
                layout: "person",
                collection: ["people", "Harrypedia", last_name],
                title: name,
                body: DEBUG
                  ? `<span class="debug">body for ${person.id}</span>`
                  : `<span>This is a placeholder page</span>`,
                route: BackupPersonRoute,
                label: `External-${name.replaceAll(" ", "_")}`,
                data: {
                  grampsID: person.id,
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
