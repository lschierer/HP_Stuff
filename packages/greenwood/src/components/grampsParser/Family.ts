import GrampsCSS from "../../styles/Gramps.css" with { type: "css" };

import {
  type GedcomFamily,
  type GedcomPerson,
} from "../../schemas/gedcom/index.ts";

import "./IndividualName.ts";

import debugFunction from "../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

import GrampsState from "./state.ts";
import { getGrampsData } from "./state.ts";

export default class GrampsFamily extends HTMLElement {
  public familyHandle: string = "";

  private _childHandles = new Array<string>();

  private _myHandle: string = "";

  private _family: GedcomFamily.GedcomElement | null = null;
  private _mother: GedcomPerson.GedcomElement | null = null;
  private _father: GedcomPerson.GedcomElement | null = null;
  private _children = new Array<GedcomPerson.GedcomElement>();
  private _childIDs = new Set<string>();

  private _IAmFather: boolean = false;

  protected populateLocalAttributes = () => {
    for (const attr of this.attributes) {
      if (DEBUG) {
        console.log(`attr has name ${attr.name}`);
      }
      if (
        !attr.name.toLowerCase().localeCompare("familyHandle".toLowerCase())
      ) {
        if (DEBUG) {
          console.log(`found familyHandle attr with value ${attr.value}`);
        }
        this.familyHandle = attr.value;
      }
      if (attr.name.toLowerCase().endsWith("handle")) {
        this._myHandle = attr.value;
      }
      if (
        !attr.name.toLowerCase().localeCompare("childrenHandles".toLowerCase())
      ) {
        this._childHandles = JSON.parse(
          decodeURIComponent(attr.value)
        ) as string[];
      }
    }
    if (DEBUG) {
      console.log(
        `looking for familyHandle "${this.familyHandle}" and handle "${this._myHandle}"`
      );
    }
  };

  protected getData = async () => {
    if (!GrampsState.people.size || !GrampsState.families.size) {
      await getGrampsData(import.meta.url);
    }

    if (GrampsState.families.size) {
      GrampsState.families.forEach((family) => {
        if (!family.handle.localeCompare(this.familyHandle)) {
          this._family = family;
        }
      });
    }

    if (GrampsState.people.size > 0 && this._family) {
      if (DEBUG) {
        console.log(`looking for spouse and children`);
      }
      let spouseHandle = "";
      if (this._family.father_handle) {
        if (this._family.father_handle.localeCompare(this._myHandle)) {
          spouseHandle = this._family.father_handle;
          if (DEBUG) {
            console.log(`spouse is father with handle ${spouseHandle}`);
          }
        } else if (this._family.mother_handle) {
          if (this._family.mother_handle.localeCompare(this._myHandle)) {
            spouseHandle = this._family.mother_handle;
            if (DEBUG) {
              console.log(`spouse is mother with handle ${spouseHandle}`);
            }
          }
        }
      }
      GrampsState.people.forEach((p) => {
        if (DEBUG) {
          console.log(`inspecting ${p.id} with handle ${p.handle}`);
        }
        if (this._family) {
          if (this._family.father_handle) {
            if (!p.handle.localeCompare(this._family.father_handle)) {
              this._father = p;
              if (!p.handle.localeCompare(this._myHandle)) {
                this._IAmFather = true;
              }
              if (DEBUG) {
                console.log(`found father`);
              }
            }
          }
          if (this._family.mother_handle) {
            if (!p.handle.localeCompare(this._family.mother_handle)) {
              this._mother = p;
              if (DEBUG) {
                console.log(`found mother`);
              }
            }
          }
        }

        if (this._family && this._family.child_ref_list.length) {
          if (
            this._family.child_ref_list
              .map((cr) => {
                return !cr.ref.localeCompare(p.handle);
              })
              .includes(true)
          ) {
            if (!this._childIDs.has(p.id)) {
              this._children.push(p);
              this._childIDs.add(p.id);
            }
          }
        }
      });
    }
  };

  async connectedCallback() {
    this.populateLocalAttributes();
    await this.getData();
    this.attachShadow({ mode: "open" });

    if (this.shadowRoot) {
      this.shadowRoot.adoptedStyleSheets.push(GrampsCSS);
      if (this._family) {
        this.shadowRoot.innerHTML = `
          <div class="FamilyListing">
            ${DEBUG ? `<span>Gramps Family Component </span>` : ""}
            ${
              this._childHandles.length >= 1
                ? `
              Father:${" "}
              ${
                this._father
                  ? `<individual-name personId=${this._father.id} inline link></individual-name>`
                  : "Unknown"
              }<br/>
              Mother:${" "}
              ${
                this._mother
                  ? `<individual-name personId=${this._mother.id} inline link></individual-name>`
                  : "Unknown"
              }
            `
                : `
              With:${" "}
              ${
                this._IAmFather
                  ? this._mother
                    ? `<individual-name personId=${this._mother.id} inline link></individual-name>`
                    : "Unknown"
                  : this._father
                    ? `<individual-name personId=${this._father.id} inline link></individual-name>`
                    : "Unknown"
              }
              `
            }

            <ul class="familylisting">
              ${this._children
                .map((person, index) => {
                  return `
                  <li id="person-${index}">
                    <individual-name
                      inline
                      link
                      personId=${person.id}
                    ></individual-name>
                  </li>
                `;
                })
                .join("\n")}
            </ul>
          </div>
        `;
      } else {
        this.shadowRoot.innerHTML = `
          <span>Family Not Found</span>
        `;
      }
    }
  }
}

customElements.define("gramps-family", GrampsFamily);
