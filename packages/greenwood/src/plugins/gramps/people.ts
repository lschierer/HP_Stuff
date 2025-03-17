import type { SourcePlugin, ExternalSourcePage } from "@greenwood/cli";

import debugFunction from "../../lib/debug.ts";

const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

import { GedcomPerson } from "../../schemas/gedcom/index.ts";

import {
  GrampsState,
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
    name: "source-plugin-external-page",
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
            const last_name =
              person.primary_name.surname_list
                .flatMap((sn) => {
                  if (
                    sn.primary ||
                    !sn.origintype.string.localeCompare(
                      GedcomPerson.StringEnum.Enum["Birth Name"]
                    ) ||
                    !sn.origintype.string.localeCompare(
                      GedcomPerson.StringEnum.Enum.Given
                    )
                  ) {
                    return sn.surname;
                  }
                  if (person.primary_name.surname_list.length == 1) {
                    return sn.surname;
                  }
                  return "";
                })
                .filter((sn) => sn.length > 0)[0] ?? "";
            const suffix = person.primary_name.suffix;
            const name = `${first_name} ${last_name} ${suffix}`;
            const FragmentRoute = `/api/gramps/people/${person.id}/`;

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
            console.log(`pushing Fragment page ${p.id} with title ${p.title}`);
            returnPages.push(p);

            let BackupPersonRoute = `/Harrypedia/people/${last_name.length ? last_name : "Unknown"}/`;
            if (first_name.length) {
              BackupPersonRoute += `{first_name}${suffix.length > 0 ? `_${suffix}` : ""}/`;
            } else {
              BackupPersonRoute += `${person.id}/`;
            }
            const bp: ExternalSourcePage = {
              id: person.id,
              layout: "person",
              title: name,
              body: DEBUG
                ? `<span class="debug">body for ${person.id}</span>`
                : "",
              route: BackupPersonRoute,
              label: `External-${name.replaceAll(" ", "_")}`,
              data: {
                grampsID: person.id,
              },
            };
            console.log(`pushing Backup page ${bp.id} with title ${bp.title}`);
            returnPages.push(bp);
          }
        }
        return returnPages;
      };
    },
  };
};
