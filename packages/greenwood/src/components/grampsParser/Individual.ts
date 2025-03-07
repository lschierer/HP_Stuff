import { GedcomEvent, GedcomPerson } from "../../schemas/gedcom/index.ts";
import { male, female, type genders } from "../../lib/GedcomConstants.ts";

import "iconify-icon";
import "./AncestorsTreeChart.ts";
import "./IndividualName.ts";
import "./event.ts";
import "./Family.ts";

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
  private gender: genders | undefined = undefined;

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
        const data = (await eventsResponse.json()) as object;
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
      if (this.person.gender === male.JSONconstant) {
        this.gender = male.textName;
      } else {
        this.gender = female.textName;
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
        if (this.person) {
          this.processPerson();
          const iconName =
            this.person.gender === male.JSONconstant
              ? "ion-male"
              : this.person.gender === female.JSONconstant
                ? "ion-female"
                : "tdesign:user-unknown";
          const iconclasses = "spectrum-Icon spectrum-Icon--sizeXXL ".concat(
            this.person.gender === male.JSONconstant
              ? "color-male"
              : this.person.gender === female.JSONconstant
                ? "color-female"
                : "icon1"
          );
          const handle: string = this.person.handle;
          const parentHandle =
            this.person.gender == male.JSONconstant
              ? "fatherHandle"
              : "motherHandle";
          this.shadowRoot.innerHTML = `
            <div class="spectrum-Typography">
              <div class=" CardContainer " role="figure">
                <div class=" CardAsset ">
                  <iconify-icon
                    aria-hidden="true" role="img"
                    icon=${iconName} class="${iconclasses}"
                    width="10em"
                  ></iconify-icon>
                </div>

                <div class=" CardBody ">
                  <div class=" Card-header ">
                    <div class=" Card-title ">
                      <individual-name noIcon personId=${this.person.id}></individual-name>
                    </div>
                  </div>

                  <div class=" Card-content ">
                    <div class=" Card-description ">
                      <div class="General ">
                        <ul class="bio">
                          <li>
                            Gramps Id:${" "}
                            ${this.personId}
                          </li>
                          <li>
                            Birth:${" "}
                            ${
                              this.BirthIndex >= 0
                                ? `<gedcom-event handle=${this.eventsRefs[this.BirthIndex].ref} ></gedcom-event>`
                                : "Unknown"
                            }
                          </li>
                          <li>
                            Death:${" "}
                            ${
                              this.DeathIndex >= 0
                                ? `<gedcom-event handle=${this.eventsRefs[this.DeathIndex].ref} ></gedcom-event>`
                                : "Unknown"
                            }
                          </li>
                        </ul>
                      </div>
                      <div class="Unions">
                        ${
                          this.person.family_list.length > 0
                            ? `
                            <h4 class="spectrum-Heading spectrum-Heading--serif spectrum-Heading--sizeS">Unions & children</h4>
                            <ul class="bio">
                              ${this.person.family_list
                                .map((family) => {
                                  return `
                                  <li>
                                    <gramps-family
                                      familyHandle=${family}
                                      ${parentHandle}=${handle}
                                    ></gramps-family>
                                  </li>
                                  `;
                                })
                                .join("\n")}

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
                            ${this.person.parent_family_list
                              .map((family, index) => {
                                return `
                                <li id="family-${index}">
                                  <gramps-family familyHandle=${family} childrenHandles=${encodeURIComponent(JSON.stringify([handle]))}></gramps-family>
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
              </div>
              <div class="TimelineCard rounded border-2">
                <ancestors-tree grampsId=${this.person.id} ></ancestors-tree>
              </div>
            </div>
          `;
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
