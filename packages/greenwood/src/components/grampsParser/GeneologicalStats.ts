import "iconify-icon";
import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { until } from "lit/directives/until.js";

import {
  GedcomEvent,
  GedcomFamily,
  GedcomPerson,
} from "@hp-stuff/schemas/gedcom";

import debugFunction from "../../lib/debug.ts";

const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

import SpectrumCardCSS from "@spectrum-css/card/dist/index.css" with { type: "css" };

@customElement("geneological-stats")
export default class GeneologicalStats extends LitElement {
  private people: GedcomPerson.GedcomElement[] =
    new Array<GedcomPerson.GedcomElement>();

  private families: GedcomFamily.GedcomElement[] =
    new Array<GedcomFamily.GedcomElement>();

  private events: GedcomEvent.GedcomElement[] =
    new Array<GedcomEvent.GedcomElement>();

  protected getData = async () => {
    const peopleUrl = "/api/gedcom/people";
    if (DEBUG) {
      console.log(`peopleUrl is ${peopleUrl.toString()}`);
    }

    const peopleResponse = await fetch(peopleUrl);
    if (peopleResponse.ok) {
      const data = (await peopleResponse.json()) as object;
      const valid = GedcomPerson.GedcomElement.array().safeParse(data);
      if (valid.success) {
        this.people.push(...valid.data);
      }
    }

    const familiesUrl = "/api/gedcom/families";
    if (DEBUG) {
      console.log(`familiesUrl is ${familiesUrl.toString()}`);
    }
    const familiesResponse = await fetch(familiesUrl);
    if (familiesResponse.ok) {
      const data = (await familiesResponse.json()) as object;
      const valid = GedcomFamily.GedcomElement.array().safeParse(data);
      if (valid.success) {
        this.families.push(...valid.data);
      }
    }

    const eventsUrl = "/api/gedcom/events";
    if (DEBUG) {
      console.log(`eventsURL is ${eventsUrl.toString()}`);
    }

    const eventsResponse = await fetch(eventsUrl);
    if (eventsResponse.ok) {
      const data = (await eventsResponse.json()) as object;
      const valid = GedcomEvent.GedcomElement.array().safeParse(data);
      if (valid.success) {
        if (DEBUG) {
          console.log(`found ${valid.data.length} events`);
        }
        this.events.push(...valid.data);
      } else {
        if (DEBUG) {
          console.error(
            `failed to parse events`,
            JSON.stringify(valid.error.message)
          );
        }
      }
    }

    if (DEBUG) {
      console.log(
        `people looks like \n `,
        JSON.stringify(this.people),
        `family looks like \n`,
        JSON.stringify(this.families),
        `events looks like \n`,
        JSON.stringify(this.events)
      );
    }
  };

  static override get styles() {
    return [SpectrumCardCSS];
  }

  protected override render() {
    if (DEBUG) {
      console.log(`GeneologicalStats render start`);
    }
    //await this.getData();
    if (DEBUG) {
      console.log(`GeneologicalStats render has data`);
    }
    return html`
      <div
        tabindex="0"
        class=" spectrum-Card spectrum--medium spectrum-Card--horizontal "
        id="statistics"
        style=""
        role="figure"
      >
        <div class=" spectrum-Card-preview ">
          <iconify-icon
            icon="oui:stats"
            alt=""
            slot="preview"
            role="img"
            width="5rem"
          ></iconify-icon>
        </div>

        <div class=" spectrum-Card-body ">
          <div class=" spectrum-Card-header ">
            <div class=" spectrum-Card-title ">
              Geneological Data Statistics
            </div>
          </div>
          <div class=" spectrum-Card-content ">
            <div class=" spectrum-Card-description ">
              ${until(
                this.getData().then(() => {
                  return html`
                    ${this.people.length
                      ? html`
                          <span>There are ${this.people.length} people</span>
                        `
                      : "<span>There are no people</span>"}
                    <br />
                    ${this.families.length
                      ? html`
                          <span
                            >There are ${this.families.length} families</span
                          >
                        `
                      : "<span>There are no families</span>"}
                    <br />
                    ${this.events.length
                      ? html`
                          <span>There are ${this.events.length} events</span>
                        `
                      : "<span>There are no events</span>"}
                    ${!(
                      this.people.length &&
                      this.families.length &&
                      this.events.length
                    )
                      ? html`<span>No Header Info Available</span>`
                      : ""}
                  `;
                }),
                html`<span>Loading...</span>`
              )}
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
