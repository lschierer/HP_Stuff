import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";

import GrampsCSS from "../../styles/Gramps.css" with { type: "css" };

import { GedcomPerson } from "../../schemas/gedcom/index.ts";

import "./IndividualName.ts";

import debugFunction from "../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}
export class GrampsFamily extends LitElement {
  @property({ type: String })
  public familyName: string = "";

  @property({ type: String })
  public handle: string = "";

  private _people: Array<GedcomPerson.GedcomElement> =
    new Array<GedcomPerson.GedcomElement>();
  private displaylist = new Array<GedcomPerson.GedcomElement>();

  static override get styles() {
    return [GrampsCSS];
  }
  protected getData = async () => {
    const PeopleResponse = await fetch(
      new URL("/api/gedcom/people", import.meta.url)
    );
    if (PeopleResponse.ok) {
      const data = (await PeopleResponse.json()) as object;
      const valid = GedcomPerson.GedcomElement.array().safeParse(data);
      if (valid.success) {
        this._people = valid.data;
      }
    }
  };
  override render() {
    if (this._people.length > 0) {
      this.displaylist = this._people.filter((p) => {
        return p.primary_name.surname_list
          .map((sn) => {
            return !sn.surname.localeCompare(this.familyName);
          })
          .includes(true);
      });
    }
    return html`
      ${DEBUG && html`<span>Gramps Family Component </span>`}
      <ul class="familylisting">
        ${this.displaylist.map((person, index) => {
          return html`
            <li id="person-${index}">
              <individual-name
                inline
                link
                personId=${person.id}
              ></individual-name>
            </li>
          `;
        })}
      </ul>
    `;
  }
}

customElements.define("gramps-family", GrampsFamily);
