import "./IndividualName.ts";
import {
  GedcomEvent,
  GedcomFamily,
  GedcomPerson,
} from "../../schemas/gedcom/index.ts";

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
  private allFamilies = new Array<GedcomFamily.GedcomElement>();
  private allEvents = new Array<GedcomEvent.GedcomElement>();
  private allPeople = new Array<GedcomPerson.GedcomElement>();

  protected populateLocalAttributes = () => {
    for (const attr of this.attributes) {
      if (DEBUG) {
        console.log(`attr has name ${attr.name}`);
      }
      if (!attr.name.toLowerCase().localeCompare("familyname")) {
        if (DEBUG) {
          console.log(`found familyname attr with value ${attr.value}`);
        }
        this.familyName = attr.name;
      }
      if (!attr.name.toLowerCase().localeCompare("handle")) {
        this.handle = attr.name;
      }
    }
    if (DEBUG) {
      console.log(`looking for ${this.familyName} and handle "${this.handle}"`);
    }
  };

  protected findChildren = (handle: string) => {
    return this.allPeople.filter((person) => {
      return person.parent_family_list.includes(handle);
    });
  };

  async connectedCallback() {
    this.populateLocalAttributes();
    this.attachShadow({ mode: "open" });
    if (this.shadowRoot) {
      this.shadowRoot.adoptedStyleSheets.push(GrampsCSS);
      this.shadowRoot.adoptedStyleSheets.push(FamilyListingCSS);

      const familyURL = new URL("/api/gedcom/families", import.meta.url);
      const familyResponce = await fetch(familyURL);
      if (familyResponce.ok) {
        const data = (await familyResponce.json()) as object;
        const valid = GedcomFamily.GedcomElement.array().safeParse(data);
        if (valid.success) {
          this.allFamilies = valid.data;
        } else {
          if (DEBUG) {
            console.error(
              `error fetching families in FamilyListing`,
              valid.error.message
            );
          }
        }
      }

      const eventURL = new URL("/api/gedcom/events", import.meta.url);
      const eventResponce = await fetch(eventURL);
      if (eventResponce.ok) {
        const data = (await eventResponce.json()) as object;
        const valid = GedcomEvent.GedcomElement.array().safeParse(data);
        if (valid.success) {
          this.allEvents = valid.data;
        } else {
          if (DEBUG) {
            console.error(
              `error fetching events in FamilyListing`,
              valid.error.message
            );
          }
        }
      }

      const peopleURL = new URL("/api/gedcom/people", import.meta.url);
      const peopleResponce = await fetch(peopleURL);
      if (peopleResponce.ok) {
        const data = (await peopleResponce.json()) as object;
        const valid = GedcomPerson.GedcomElement.array().safeParse(data);
        if (valid.success) {
          this.allPeople = valid.data.filter((p) => {
            return p.primary_name.surname_list
              .map((sn) => {
                return !sn.surname.localeCompare(this.familyName);
              })
              .includes(true);
          });
          if (DEBUG) {
            console.log(`starting with ${this.allPeople.length} people`);
          }
        } else {
          if (DEBUG) {
            console.error(
              `error fetching events in FamilyListing`,
              valid.error.message
            );
          }
        }
      }

      const displaylist = new Array<GedcomPerson.GedcomElement>();
      const families = new Map<string, string[]>();

      const p1 = this.allPeople
        .filter((p1) => {
          if (this.handle.length > 0) {
            return p1.parent_family_list.includes(this.handle);
          } else {
            return p1.parent_family_list.length == 0;
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
          displaylist.push(person);
          families.set(fk, fc);
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
          displaylist.push(person);
          families.set(fk, fc);
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

      this.shadowRoot.innerHTML = `
        <ul class="familylisting">
          ${displaylist
            .map((person, index) => {
              return `
              <li id="person-${index}">
                <individual-name inline link personId=${person.id} ></individual-name>
                ${
                  person.event_ref_list.length > 0 &&
                  person.birth_ref_index >= 0 &&
                  person.birth_ref_index < person.event_ref_list.length
                    ? `<Event handle={person.event_ref_list[person.birth_ref_index].ref} />`
                    : "Unknown"
                }
                -
                ${
                  person.event_ref_list.length > 0 &&
                  person.death_ref_index < person.event_ref_list.length &&
                  person.death_ref_index >= 0
                    ? `<Event handle={person.event_ref_list[person.death_ref_index].ref} />`
                    : "Unknown"
                }
                ${
                  fa[index].length > 0
                    ? fa[index]
                        .map((p2) => {
                          return `
                        <family-listing handle=${p2} familyName=${this.familyName} ></family-listing>
                      `;
                        })
                        .join("")
                    : ""
                }
              </li>
              `;
            })
            .join("")}
        </ul>
      `;
    }
  }
}
customElements.define("family-listing", FamilyListing);
