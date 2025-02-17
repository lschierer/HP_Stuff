import { LitElement, html } from "lit";
import { state } from "lit/decorators.js";

import { z } from "zod";

import GrampsCSS from "../../styles/Gramps.css";

import {
  GedcomEvent,
  GedcomFamily,
  GedcomPerson,
} from "../../schemas/gedcom/index.ts";

const DEBUG = true;

export default class GenealogicalData extends LitElement {
  @state()
  private people: GedcomPerson.GedcomElement[] =
    new Array<GedcomPerson.GedcomElement>();

  @state()
  private families: GedcomFamily.GedcomElement[] =
    new Array<GedcomFamily.GedcomElement>();

  @state()
  private events: GedcomEvent.GedcomElement[] =
    new Array<GedcomEvent.GedcomElement>();

  @state()
  private url: URL | string | null;

  constructor() {
    super();

    this.url = new URL("/api/gedcom/", document.URL);
  }

  async connectedCallback() {
    super.connectedCallback();
    if (DEBUG) console.log(`initial url is ${this.url}`);
    if (this.url instanceof URL) {
      let response = await fetch(new URL("/api/gedcom/people", this.url));
      if (response.ok) {
        const data = await response.json();
        const valid = z.array(GedcomPerson.GedcomElement).safeParse(data);
        if (valid.success) {
          this.people = valid.data;

          if (DEBUG) {
            console.log(`this.people now has ${this.people.length}`);
          }
          this.requestUpdate("people");
        } else {
          if (DEBUG) {
            console.warn(valid.error.message);
          }
        }
      } else {
        if (DEBUG) {
          console.warn(
            `response was ${response.status} with text ${response.statusText}`
          );
        }
      }

      response = await fetch(new URL("/api/gedcom/families", this.url));
      if (response.ok) {
        const data = await response.json();
        const valid = z.array(GedcomFamily.GedcomElement).safeParse(data);
        if (valid.success) {
          this.families = valid.data;

          if (DEBUG) {
            console.log(`this.families now has ${this.families.length}`);
          }
          this.requestUpdate("families");
        } else {
          if (DEBUG) {
            console.warn(valid.error.message);
          }
        }
      } else {
        if (DEBUG) {
          console.warn(
            `response was ${response.status} with text ${response.statusText}`
          );
        }
      }

      response = await fetch(new URL("/api/gedcom/events", this.url));
      if (response.ok) {
        const data = await response.json();
        const valid = z.array(GedcomEvent.GedcomElement).safeParse(data);
        if (valid.success) {
          this.events = valid.data;

          if (DEBUG) {
            console.log(`this.events now has ${this.events.length}`);
          }
          this.requestUpdate("events");
        } else {
          if (DEBUG) {
            console.warn(valid.error.message);
          }
        }
      } else {
        if (DEBUG) {
          console.warn(
            `response was ${response.status} with text ${response.statusText}`
          );
        }
      }
    } else {
      if (DEBUG) {
        console.warn(`this.url is not a url`);
      }
    }
  }

  static styles = [GrampsCSS];

  render() {
    if (this.people.length > 0) {
      if (DEBUG) console.log(`grampsParser/index render; `);

      let t = html``;
      if (DEBUG)
        console.log(`grampsParser/index render; confirmed I have parsed data`);
      /*
        t = html`${t}Gramps Data exported ${gramps.header.created.date}<br />`;


        */
      const psize = this.people.length;
      t = html`${t}There are ${psize} people<br />`;
      const fsize = this.families.length;
      t = html`${t}There are ${fsize} families<br />`;
      const esize = this.events.length;
      t = html`${t}There are ${esize} events<br />`;

      return html`${t}`;
    }
    return html`No Header Info Available`;
  }
}

customElements.define("genealogical-data", GenealogicalData);
