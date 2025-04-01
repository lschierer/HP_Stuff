export const prerender = false;
import { LitElement, html, unsafeCSS, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";

import {
  GedcomPerson,
  type GedcomFamily,
  type GedcomEvent,
} from "../../schemas/gedcom/index.ts";
import { z } from "zod";

import GrampsCSS from "../../styles/Gramps.css" with { type: "css" };

import debugFunction from "../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}
export default class GenealogicalData extends LitElement {
  @property({ type: Array })
  public people: GedcomPerson.GedcomElement[] =
    new Array<GedcomPerson.GedcomElement>();

  @property({ type: Array })
  public families: GedcomFamily.GedcomElement[] =
    new Array<GedcomFamily.GedcomElement>();

  @property({ type: Array })
  public events: GedcomEvent.GedcomElement[] =
    new Array<GedcomEvent.GedcomElement>();

  static override styles = [unsafeCSS(GrampsCSS)];

  protected override willUpdate(_changedProperties: PropertyValues): void {
    super.willUpdate(_changedProperties);

    if (_changedProperties.has("people")) {
      if (!Array.isArray(this.people)) {
        const valid = z
          .array(GedcomPerson.GedcomElement)
          .safeParse(JSON.parse(this.people));
        if (valid.success) {
          this.people = valid.data;
        } else {
          if (DEBUG) {
            console.error(`invalid people content in willupdate`);
            console.error(valid.error.message);
          }
        }
      } else if (!this.people.length) {
        if (DEBUG) {
          console.warn(`null this.people`);
        }
      }
    }
  }

  override render() {
    if (DEBUG) {
      console.log(`grampsParser/index render; `);
    }

    let t = html``;
    if (
      (Array.isArray(this.people) && this.people.length > 0) ||
      (Array.isArray(this.families) && this.families.length > 0) ||
      (Array.isArray(this.events) && this.events.length > 0)
    ) {
      if (DEBUG) {
        console.log(`grampsParser/index render; confirmed I have parsed data`);
      }

      t = html`${t}Gramps Data exported <br />`;
      const psize = this.people.length;
      t = html`${t}There are ${psize} people<br />`;
      /*

      const fsize = gramps.families.family.length;
      t = html`${t}There are ${fsize} families<br />`;
      const esize = gramps.events.event.length;
      t = html`${t}There are ${esize} events<br />`;
      */
      return html`${t}`;
    }
    return html`No Header Info Available`;
  }
}

customElements.define("genealogical-data", GenealogicalData);
