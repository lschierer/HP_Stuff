import { GedcomPerson } from "../../schemas/gedcom/index.ts";

import "iconify-icon";
import "./AncestorsTreeChart/AncestorsTree.ts";
import "./IndividualName.ts";
import "./event.ts";
import "./Family.ts";
import GrampsImmediateFamily from "./Family.ts";

import GrampsCSS from "../../styles/Gramps.css" with { type: "css" };

import debugFunction from "../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

import { GrampsState, getGrampsData } from "./state.ts";
import IndividualName from "./IndividualName.ts";

export default class GrampsIndividual extends HTMLElement {
  public personId: string = "";

  public person: GedcomPerson.GedcomElement | undefined = undefined;
  private eventsRefs: GedcomPerson.EventRef[] =
    new Array<GedcomPerson.EventRef>();

  protected getAttributes = () => {
    for (const attr of this.attributes) {
      if (DEBUG) {
        console.log(`attr has name ${attr.name}`);
      }
      if (!attr.name.toLowerCase().localeCompare("personid")) {
        if (DEBUG) {
          console.log(`found personId attr with value ${attr.value}`);
        }
        this.personId = attr.value;
      }
      if (!attr.name.toLowerCase().localeCompare("person")) {
        const valid = GedcomPerson.GedcomElement.safeParse(
          JSON.parse(decodeURIComponent(attr.value))
        );
        if (valid.success) {
          this.person = valid.data;
          this.personId = this.person.id;
        } else {
          throw new Error(
            `error parsing person in Individual.ts: \n ${valid.error.message}`
          );
        }
      }
    }
    if (DEBUG) {
      console.log(`looking for "${this.personId}"`);
    }
  };

  readonly initialize = async () => {
    await this.getGedcomData();
  };

  protected getGedcomData = async () => {
    if (GrampsState.people.size == 0) {
      await getGrampsData();
      const p = GrampsState.people.get(this.personId);
      if (p) {
        this.person = p;
      } else {
        console.error(
          `could not get person ${this.personId} despite getGrampsData call`
        );
      }
    } else {
      const p = GrampsState.people.get(this.personId);
      if (p) {
        this.person = p;
      } else {
        console.error(
          `I have cached GrampsState but cannot find ${this.personId}`
        );
      }
    }

    if (!GrampsState.events.size) {
      await getGrampsData();
    }
  };

  protected processPerson = () => {
    if (this.person) {
      if (this.person.event_ref_list.length > 0) {
        this.eventsRefs.push(...this.person.event_ref_list);
      }
    }
  };

  readonly getInnerHtml = async () => {
    if (this.person) {
      if (DEBUG) {
        console.log(
          `body function for ${this.person.id}`,
          `${this.person.id} has ${this.person.family_list.length} family_list size`,
          `${this.person.id} has ${this.person.parent_family_list.length} parent family list size}`
        );
      }
      const personName = new IndividualName(this.person.id);
      const eventsRefs = this.person.event_ref_list;
      const BirthIndex = this.person.birth_ref_index;
      const DeathIndex = this.person.death_ref_index;

      const parent_families = new Array<GrampsImmediateFamily>();
      const families_as_parent = new Array<GrampsImmediateFamily>();
      for (const [key, cf] of GrampsState.families) {
        if (DEBUG) {
          console.log(`investigating ${key}`);
        }
        for (const fr of this.person.parent_family_list) {
          if (!cf.handle.localeCompare(fr)) {
            const gif = new GrampsImmediateFamily();
            gif.grampsId = cf.id;
            gif.IAmAParent = false;
            parent_families.push(gif);
          }
        }
        for (const fr of this.person.family_list) {
          if (!cf.handle.localeCompare(fr)) {
            const gif = new GrampsImmediateFamily();
            gif.grampsId = cf.id;
            gif.IAmAParent = true;
            gif.ParentID = this.person.id;
            families_as_parent.push(gif);
          }
        }
      }

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
                      ${this.person.id}
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
                    this.person.family_list.length > 0
                      ? `
                      <h4 class="spectrum-Heading spectrum-Heading--serif spectrum-Heading--sizeS">Unions & children</h4>
                      <ul class="bio">
                        ${families_as_parent
                          .map((family) => {
                            return `
                            ${family.getList()}
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
                    this.person.parent_family_list.length >= 1
                      ? `
                    <h4 class="spectrum-Heading spectrum-Heading--serif spectrum-Heading--sizeS">Parents and Siblings</h4>
                    <ul class="bio">
                      ${parent_families
                        .map((family, index) => {
                          return `
                          <li id="family-${index}">
                            <span>
                              ${family.getList()}
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
          <ancestors-tree grampsId=${this.person.id} maxDepth=7 ></ancestors-tree>
        </div>
      </div>
      `;
    } else {
      return "";
    }
  };

  async connectedCallback() {
    this.getAttributes();
    await this.getGedcomData();
    this.attachShadow({ mode: "open" });
    if (this.shadowRoot) {
      this.shadowRoot.adoptedStyleSheets.push(GrampsCSS);
      if (this.personId) {
        if (this.person) {
          this.processPerson();

          this.shadowRoot.innerHTML = await this.getInnerHtml();
        } else {
          console.warn(`No person found for ${this.personId}`);
        }
      } else {
        console.warn(`connectedCallback for GrampsIndividual has no personId`);
      }
    }
  }
}
customElements.define("gramps-individual", GrampsIndividual);
