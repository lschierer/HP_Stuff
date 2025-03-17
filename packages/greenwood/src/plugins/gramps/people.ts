import type { SourcePlugin, ExternalSourcePage } from "@greenwood/cli";

import debugFunction from "../../lib/debug.ts";

const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

import { GedcomPerson } from "../../schemas/gedcom/index.ts";

import { GrampsState, getGrampsData } from "./state.ts";

import GrampsPersonName from "./name.ts";
import GrampsImmediateFamily from "./immediateFamily.ts";

const body = async (person: GedcomPerson.GedcomElement) => {
  if (DEBUG) {
    console.log(
      `body function for ${person.id}`,
      `${person.id} has ${person.family_list.length} family_list size`,
      `${person.id} has ${person.parent_family_list.length} parent family list size}`
    );
  }
  const personName = new GrampsPersonName(person.id);
  const eventsRefs = person.event_ref_list;
  const BirthIndex = person.birth_ref_index;
  const DeathIndex = person.death_ref_index;

  const parent_families = new Array<GrampsImmediateFamily>();
  const families_as_parent = new Array<GrampsImmediateFamily>();
  GrampsState.families.forEach((cf) => {
    for (const fr of person.parent_family_list) {
      if (!cf.handle.localeCompare(fr)) {
        const gif = new GrampsImmediateFamily();
        gif.grampsId = cf.id;
        gif.IAmAParent = false;
        parent_families.push(gif);
      }
    }
    for (const fr of person.family_list) {
      if (!cf.handle.localeCompare(fr)) {
        const gif = new GrampsImmediateFamily();
        gif.grampsId = cf.id;
        gif.IAmAParent = true;
        gif.ParentID = person.id;
        families_as_parent.push(gif);
      }
    }
  });

  await Promise.all(
    parent_families.map(async (f) => {
      await f.initialize();
    })
  );

  await Promise.all(
    families_as_parent.map(async (f) => {
      await f.initialize();
    })
  );

  return `
  <link rel="stylesheet" href="/styles/Gramps.css" />
  <div class="spectrum-Typography">
    <div class=" CardContainer " role="figure">
      <div class=" CardAsset ">
        <iconify-icon
          aria-hidden="true" role="img"
          icon=${personName.getIconName()} class="${personName.getIconClass()}"
          height="none"
          width="none"
        ></iconify-icon>
      </div>

      <div class=" CardBody ">
        <div class=" Card-header ">
          <div class=" Card-title ">
            <span class="spectrum-Heading spectrum-Heading--serif spectrum-Heading--sizeL spectrum-Heading--heavy">
              ${personName.displayName()}
            </span>
          </div>
        </div>

          <div class=" Card-description ">
            <div class="General ">
              <ul class="bio">
                <li>
                  Gramps Id:${" "}
                  ${person.id}
                </li>
                <li>
                  Birth:${" "}
                  ${
                    BirthIndex >= 0
                      ? `<gedcom-event handle=${eventsRefs[BirthIndex].ref} ></gedcom-event>`
                      : "Unknown"
                  }
                </li>
                <li>
                  Death:${" "}
                  ${
                    DeathIndex >= 0
                      ? `<gedcom-event handle=${eventsRefs[DeathIndex].ref} ></gedcom-event>`
                      : "Unknown"
                  }
                </li>
              </ul>
            </div>
          </div>
          <div class=" Card-Extra">
            <div class="Unions">
              ${
                person.family_list.length > 0
                  ? `
                  <h4 class="spectrum-Heading spectrum-Heading--serif spectrum-Heading--sizeS">Unions & children</h4>
                  <ul class="bio">
                    ${families_as_parent
                      .map((family) => {
                        return `
                        ${family.getListAsChild()}
                      `;
                      })
                      .join("")}
                  </ul>
                `
                  : ""
              }
            </div>
            <div class="Parents">
              ${
                person.parent_family_list.length >= 1
                  ? `
                <h4 class="spectrum-Heading spectrum-Heading--serif spectrum-Heading--sizeS">Parents and Siblings</h4>
                <ul class="bio">
                  ${parent_families
                    .map((family, index) => {
                      return `
                      <li id="family-${index}">
                        <span>
                          ${family.getListAsChild()}
                        </span>
                      </li>
                      `;
                    })
                    .join("\n")}
                </ul>
              `
                  : ""
              }
            </div>
          </div>
      </div>
    </div>
    <div class="TimelineCard rounded border-2">
      <ancestors-tree grampsId=${person.id} maxDepth=7 ></ancestors-tree>
    </div>
  </div>
  `;
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
            const last_name = person.primary_name.surname_list
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
              .filter((sn) => sn.length > 0)[0];
            const suffix = person.primary_name.suffix;
            const name = `${first_name} ${last_name} ${suffix}`;
            const route = `/Harrypedia/people/${last_name}/${first_name}${suffix.length > 0 ? `_${suffix}` : ""}/`;

            const p: ExternalSourcePage = {
              id: person.id,
              title: name,
              body: await body(person),
              route,
              label: `External-${name.replaceAll(" ", "_")}`,
              data: {
                layout: "person",
              },
            };
            console.log(`pushing page ${p.id} with title ${p.title}`);
            returnPages.push(p);
          }
        }
        return returnPages;
      };
    },
  };
};
