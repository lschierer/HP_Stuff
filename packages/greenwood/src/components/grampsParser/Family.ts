import debugFunction from "../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

import { type GedcomPerson, type GedcomFamily } from "@hp-stuff/schemas/gedcom";

import { GrampsState, getGrampsData } from "./state.ts";

import GrampsPersonName from "./IndividualName.ts";

import GrampsCSS from "../../styles/Gramps.css" with { type: "css" };

export default class GrampsImmediateFamily extends HTMLElement {
  accessor grampsId = "";

  accessor IAmAParent: boolean = false;
  accessor ParentID = "";

  private _family: GedcomFamily.GedcomElement | null = null;

  private _children = new Array<GedcomPerson.GedcomElement>();

  private _father: GedcomPerson.GedcomElement | null = null;
  private _mother: GedcomPerson.GedcomElement | null = null;

  protected getAttributes = () => {
    for (const attr of this.attributes) {
      if (!attr.name.toLowerCase().localeCompare("personid")) {
        this.grampsId = attr.value;
      } else if (
        !attr.name.toLowerCase().localeCompare("IAmAParent".toLowerCase())
      ) {
        this.IAmAParent = true;
      } else if (
        !attr.name.toLowerCase().localeCompare("ParentID".toLowerCase())
      ) {
        this.ParentID = attr.value;
      }
    }
  };

  public initialize = async () => {
    await getGrampsData();
    if (!GrampsState.families.size) {
      if (DEBUG) {
        console.warn(`no families to match against`);
      }
    } else {
      if (!GrampsState.families.has(this.grampsId)) {
        if (DEBUG) {
          console.warn(`no matching family for id ${this.grampsId}`);
        }
      } else {
        const f = GrampsState.families.get(this.grampsId);
        if (f) {
          this._family = f;
        }
      }
    }

    if (GrampsState.people.size) {
      GrampsState.people.forEach((p) => {
        if (this._family) {
          if (this._family.child_ref_list.length) {
            if (
              this._family.child_ref_list
                .map((crfe) => {
                  return !crfe.ref.localeCompare(p.handle);
                })
                .includes(true)
            ) {
              if (DEBUG) {
                console.log(`found matching child ${p.gramps_id}`);
              }
              this._children.push(p);
            }
          }

          if (this._family.father_handle) {
            if (this._family.father_handle.length) {
              if (!this._family.father_handle.localeCompare(p.handle)) {
                if (DEBUG) {
                  console.log(`found father ${p.gramps_id}`);
                }
                this._father = p;
              }
            }
          }

          if (this._family.mother_handle) {
            if (this._family.mother_handle.length) {
              if (!this._family.mother_handle.localeCompare(p.handle)) {
                if (DEBUG) {
                  console.log(`found mother ${p.gramps_id}`);
                }
                this._mother = p;
              }
            }
          }
        }
      });
    }
  };

  readonly getList = () => {
    let returnable = "";
    if (this.IAmAParent) {
      if (DEBUG) {
        console.log(`returning family where I am a parent`);
      }
      if (
        this._father &&
        !this.ParentID.localeCompare(this._father.gramps_id)
      ) {
        if (this._mother) {
          const grampsPersonName = new GrampsPersonName(this._mother.gramps_id);
          grampsPersonName.icon = true;
          grampsPersonName.inline = true;
          grampsPersonName.link = true;
          returnable = `
              With: ${grampsPersonName.getNameAsHtml()}
          `;
        }
      } else if (
        this._mother &&
        !this.ParentID.localeCompare(this._mother.gramps_id)
      ) {
        if (this._father) {
          const grampsPersonName = new GrampsPersonName(this._father.gramps_id);
          grampsPersonName.icon = true;
          grampsPersonName.inline = true;
          grampsPersonName.link = true;
          returnable = `
              With: ${grampsPersonName.getNameAsHtml()}
          `;
        }
      }
      returnable = returnable.concat(`
        <ul class="familylisting">
          ${this._children
            .map((person, index) => {
              if (DEBUG) {
                console.log(
                  `adding person with id ${person.gramps_id} to ul familylisting as child`
                );
              }
              const childPersonName = new GrampsPersonName(person.gramps_id);
              childPersonName.icon = true;
              childPersonName.inline = true;
              childPersonName.link = true;
              return `
                <li id="person-${index}">
                  ${childPersonName.getNameAsHtml()}
                </li>
              `;
            })
            .join("")}
        </ul>
      `);
    } else {
      let fatherHTHML = "";
      if (this._father) {
        const fatherName = new GrampsPersonName(this._father.gramps_id);
        fatherName.link = true;
        fatherName.inline = true;
        fatherName.icon = true;
        fatherHTHML = fatherName.getNameAsHtml();
      } else {
        fatherHTHML = "Unknown";
      }

      let motherHTML = "";
      if (this._mother) {
        const motherName = new GrampsPersonName(this._mother.gramps_id);
        motherName.link = true;
        motherName.inline = true;
        motherName.icon = true;
        motherHTML = motherName.getNameAsHtml();
      } else {
        motherHTML = "Unknown";
      }

      returnable = `
        Father: ${fatherHTHML}
        <br/>
        Mother: ${motherHTML}
      `;
    }

    returnable = `
      <div class="FamilyListing">
        ${returnable}
      </div>
    `;
    return returnable;
  };

  async connectedCallback() {
    document.adoptedStyleSheets.push(GrampsCSS);
    this.getAttributes();
    if (!GrampsState.families.size) {
      await this.initialize();
    }
    if (this._family) {
      this.innerHTML = this.getList();
    }
  }
}
customElements.define("gramps-family", GrampsImmediateFamily);
