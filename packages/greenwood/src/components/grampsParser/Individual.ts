import { GedcomEvent, GedcomPerson } from "../../schemas/gedcom/index.ts";

import "./IndividualName.ts";
import "./event.ts";

import GrampsCSS from "../../styles/Gramps.css" with { type: "css" };

import debugFunction from "../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

import GrampsState from "./state.ts";
export default class GrampsIndividual extends HTMLElement {
  public personId: string = "";

  private person: GedcomPerson.GedcomElement | undefined = undefined;
  private eventsRefs: GedcomPerson.EventRef[] =
    new Array<GedcomPerson.EventRef>();
  private BirthIndex = -1;
  private DeathIndex = -1;

  protected getGedcomData = async () => {
    if (GrampsState.people.length == 0) {
      const personURL = new URL(
        `/api/gedcom/person?id=${this.personId}`,
        import.meta.url
      );
      const personResponse = await fetch(personURL);
      if (personResponse.ok) {
        const data = (await personResponse.json()) as object;
        const valid = GedcomPerson.GedcomElement.safeParse(data);
        if (valid.success) {
          GrampsState.people.push(valid.data);
          if (DEBUG) {
            console.log(`starting with ${GrampsState.people.length} people`);
          }
          this.person = valid.data;
        } else {
          if (DEBUG) {
            console.error(
              `error fetching people in FamilyListing`,
              valid.error.message
            );
          }
        }
      } else {
        if (DEBUG) {
          console.warn(
            `error fetching person data`,
            personResponse.status,
            personResponse.statusText
          );
        }
      }
    } else {
      const p = GrampsState.people.find((p) => {
        return !p.id.localeCompare(this.personId);
      });
      if (p) {
        this.person = p;
      } else {
        console.error(
          `I have cached GrampsState but cannot find ${this.personId}`
        );
      }
    }

    if (!GrampsState.events.length) {
      const eventsURL = new URL("/api/gedcom/events", import.meta.url);
      const eventsResponse = await fetch(eventsURL);
      if (eventsResponse.ok) {
        const data = await eventsResponse.json();
        const valid = GedcomEvent.GedcomElement.array().safeParse(data);
        if (valid.success) {
          valid.data.map((e) => GrampsState.events.push(e));
        } else {
          console.warn(`error parsing events`, valid.error.message);
        }
      } else {
        if (DEBUG) {
          console.warn(
            `error fetching events`,
            eventsResponse.status,
            eventsResponse.statusText
          );
        }
      }
    }
  };

  protected processPerson = () => {
    if (this.person) {
      if (this.person.event_ref_list.length > 0) {
        this.eventsRefs.push(...this.person.event_ref_list);
        this.BirthIndex = this.person.birth_ref_index;
        this.DeathIndex = this.person.death_ref_index;
      }
    }
  };

  protected populateLocalAttributes = () => {
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
    }
    if (DEBUG) {
      console.log(`looking for "${this.personId}"`);
    }
  };

  async connectedCallback() {
    this.populateLocalAttributes();
    await this.getGedcomData();
    this.attachShadow({ mode: "open" });
    if (this.shadowRoot) {
      this.shadowRoot.adoptedStyleSheets.push(GrampsCSS);
      if (this.personId) {
        this.shadowRoot.innerHTML = `
          <div class="CardBody" tabindex="0" role="figure">

          </div>
          <div class="TimelineCard rounded border-2">
            <AncestorsTreeChart isRoot={true} grampsId={person.id} />
          </div>
        `;
      } else {
        console.warn(`connectedCallback for GrampsIndividual has no personId`);
      }
    }
  }
}
customElements.define("gramps-individual", GrampsIndividual);
