import "./IndividualName.ts";
import "./event.ts";

import {
  GrampsState,
  getGrampsData,
  familyListDisplayedIds,
  findBirthLastName,
} from "./state.ts";

import { type GedcomPerson } from "../../schemas/gedcom/index.ts";

import GrampsCSS from "../../styles/Gramps.css" with { type: "css" };
import FamilyListingCSS from "../../styles/FamilyListing.css" with { type: "css" };

import debugFunction from "../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

export default class FamilyListing extends HTMLElement {
  public familyName: string = "";
  public handle: string = "";
  public showHeading: boolean = false;

  protected populateLocalAttributes = () => {
    for (const attr of this.attributes) {
      if (DEBUG) {
        console.log(`attr has name ${attr.name}`);
      }
      if (!attr.name.toLowerCase().localeCompare("familyname")) {
        if (DEBUG) {
          console.log(`found familyname attr with value ${attr.value}`);
        }
        this.familyName = attr.value;
      }
      if (!attr.name.toLowerCase().localeCompare("handle")) {
        this.handle = attr.value;
      }
      if (!attr.name.toLowerCase().localeCompare("showHeading".toLowerCase())) {
        this.showHeading = true;
      }
    }
    if (DEBUG) {
      console.log(`looking for ${this.familyName} and handle "${this.handle}"`);
    }
  };

  protected getGedcomData = async () => {
    if (GrampsState.people.size == 0) {
      await getGrampsData();
    }
  };

  async connectedCallback() {
    this.populateLocalAttributes();
    await this.getGedcomData();
    this.attachShadow({ mode: "open" });
    if (this.shadowRoot) {
      this.shadowRoot.adoptedStyleSheets.push(GrampsCSS);
      this.shadowRoot.adoptedStyleSheets.push(FamilyListingCSS);

      const displaylist = new Array<GedcomPerson.GedcomElement>();
      const families = new Map<string, string[]>();

      const p1 = new Array<GedcomPerson.GedcomElement>();
      GrampsState.people.forEach((p0) => {
        const lastname = findBirthLastName(p0);
        if (!lastname.localeCompare(this.familyName)) {
          p1.push(p0);
        }
      });

      p1.filter((p2) => {
        if (this.handle.length > 0) {
          return p2.parent_family_list.includes(this.handle);
        } else {
          return p2.parent_family_list.length == 0;
        }
      })
        .sort((a, b) => {
          return a.id.localeCompare(b.id);
        })
        .sort((a, b) => {
          return a.parent_family_list.length < b.parent_family_list.length
            ? -1
            : a.parent_family_list.length > b.parent_family_list.length
              ? 1
              : 0;
        });

      if (DEBUG) {
        console.log(`working with ${p1.length} people`);
      }

      p1.map((person) => {
        if (DEBUG) {
          console.log(
            `evaluating "${person.primary_name.first_name}" with id ${person.id}`
          );
        }
        const fc = new Array<string>();
        const fk = person.id;
        if (person.family_list.length > 0) {
          fc.push(...person.family_list);
        } else {
          if (DEBUG) {
            console.log(
              `${person.primary_name.first_name}" with id ${person.id} has no family`
            );
          }
        }

        if (this.handle.length == 0 && person.parent_family_list.length == 0) {
          if (!familyListDisplayedIds.has(person.id)) {
            familyListDisplayedIds.add(person.id);
            displaylist.push(person);
            families.set(fk, fc);
          }

          if (DEBUG) {
            console.log(
              `set key "${fk}" should match "${person.id}" for ${fc.length} children`
            );
            console.log(
              `pushing ${person.primary_name.first_name}" with id ${person.id}`
            );
            console.log(`${families.has(fk)} from test of has for ${fk}`);
          }
        } else if (person.parent_family_list.includes(this.handle)) {
          if (!familyListDisplayedIds.has(person.id)) {
            familyListDisplayedIds.add(person.id);
            displaylist.push(person);
            families.set(fk, fc);
          }

          if (DEBUG) {
            console.log(
              `set key ${fk} should match ${person.id} for ${fc.length} children`
            );
            console.log(
              `pushing ${person.primary_name.first_name}" with id ${person.id}`
            );
            console.log(`${families.has(fk)} from test of has for ${fk}`);
          }
        }
      }, "");

      if (DEBUG) {
        console.log(`families has ${families.size} families`);
        families.forEach((value, key) => {
          console.log(`m[${key}] = ${value.join(" ")}`);
        });
      }
      const fa = new Array<string[]>();
      const fk = new Array<string>();

      families.forEach((value, key) => {
        if (DEBUG) {
          console.log(`m[${key}] = ${value.join(" ")}`);
        }
        fa.push(value);
        fk.push(key);
      });

      if (displaylist.length > 0) {
        this.shadowRoot.innerHTML = `
        ${
          this.showHeading
            ? `
        <h2 class="spectrum-Heading spectrum-Heading--sizeXXL">
          The Family of ${this.familyName}
        </h2>
        <h4 class="spectrum-Heading spectrum-Heading--sizeL">
          Known Members:
        </h4>
        `
            : ""
        }

        <ul class="familylisting">
          ${displaylist
            .map((person, index) => {
              if (DEBUG) {
                console.log(
                  `for person ${person.id} fa has ${fa[index].length} entries `
                );
              }
              return `
              <li id="person-${index}">
                <individual-name inline link personId=${person.id} ></individual-name>
                (
                ${
                  person.event_ref_list.length > 0 &&
                  person.birth_ref_index >= 0 &&
                  person.birth_ref_index < person.event_ref_list.length
                    ? ` <gedcom-event handle=${person.event_ref_list[person.birth_ref_index].ref} ></gedcom-event>`
                    : "Unknown"
                }
                -
                ${
                  person.event_ref_list.length > 0 &&
                  person.death_ref_index < person.event_ref_list.length &&
                  person.death_ref_index >= 0
                    ? `<gedcom-event handle=${person.event_ref_list[person.death_ref_index].ref} ></gedcom-event>`
                    : "Unknown"
                }
                )
                ${
                  fa[index].length > 0
                    ? fa[index]
                        .map((p2) => {
                          if (DEBUG) {
                            console.log(`p2 is ${p2}`);
                          }
                          return `
                        <family-listing handle=${p2} familyName=${this.familyName} ></family-listing>
                      `;
                        })
                        .join("\n")
                    : "\n"
                }
              </li>
              `;
            })
            .join("")}
        </ul>
        ${this.showHeading ? `<hr>` : ""}
      `;
      }
    }
  }
}
customElements.define("family-listing", FamilyListing);
