export const prerender = false;
import { LitElement, html, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { provide } from "@lit/context";

import { grampsContext, GrampsState } from "./state.ts";

import * as GrampsZod from "../../lib/GrampsZodTypes.ts";

import GrampsCSS from "../../styles/Gramps.css" with { type: "css" };

//@ts-expect-error
import { AncestorsTreeChart } from "./AncestorsTreeChart/AncestorsTreeChart.ts";
//@ts-expect-error
import { IndividualName } from "./individualName.ts";
//@ts-expect-error
import { GrampsEvent } from "./events.ts";
//@ts-expect-error
import { SimpleIndividual } from "./simpleIndividual.ts";
//@ts-expect-error
import { GrampsIndividual } from "./individual.ts";
import { nothing } from "lit";

const DEBUG = true;

export class GrampsFamily extends LitElement {
  @provide({ context: grampsContext })
  @property({ attribute: false })
  private stateProvider: GrampsState = new GrampsState();

  @property()
  public url: URL | string | null;

  @state()
  private _persons: GrampsZod.Person[] | null;

  @state()
  private _name: string;

  private _renderedPersons: string[];

  constructor() {
    super();

    this._name = "";
    this.url = new URL("/assets/gramps/gramps.json", document.URL);
    this._persons = null;
    this._renderedPersons = new Array<string>();
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    if (this.url instanceof URL) {
      if (this.stateProvider instanceof GrampsState) {
        this.stateProvider.fetchData(this.url);
        this.requestUpdate("stateProvider");
      } else {
        console.warn(`no state at first update`);
      }
    } else {
      console.warn(`no URL at first update`);
    }
  }

  connectedCallback() {
    super.connectedCallback();
    if (DEBUG) {
      console.log(`GrampsFamily connectedCallback initial url is ${this.url}`);
    }
    if (this.url instanceof URL) {
      if (this.stateProvider) {
        if (DEBUG) {
          console.log(
            `GrampsFamily connectedCallback both this.url and this.state initialized, fetching data.`,
          );
        }
        this.stateProvider.fetchData(this.url);
      } else {
        if (DEBUG) {
          console.log(
            `GrampsFamily connectedCallback state not initialized, delaying data fetch`,
          );
        }
      }
    } else if (typeof this.url === "string") {
      this.url = new URL(this.url);
      this.requestUpdate("url");
    }
  }

  public async willUpdate(_changedProperties: PropertyValues) {
    super.willUpdate(_changedProperties);
    if (DEBUG) console.log(`GrampsFamily willUpdate;`);

    if (_changedProperties.has("url")) {
      if (typeof this.url === "string") {
        this.url = new URL(this.url, import.meta.url);
      }
      this.requestUpdate("url");
    }
    if (_changedProperties.has("stateProvider")) {
      if (DEBUG) {
        console.log(`willUpdate detected state change`);
      }
      if (this.url instanceof URL && this.stateProvider) {
        const status = await this.stateProvider.fetchData(this.url);
        if (status == true) {
          if (DEBUG) {
            console.log(`data fetch worked`);
          }
          this.setName();
          this.getPersons();
          this.stateProvider.familyName = this._name;
        } else {
          console.warn(`data fetch failed`);
        }
      }
    }

    if (!this._persons) {
      if (DEBUG) console.log(`persons is not set, setting up listener`);
      if (this.stateProvider) {
        this.getPersons();
      } else {
        if (DEBUG) {
          console.log(`cannot set up listener without state`);
        }
      }
    }
  }

  private setName() {
    const u = new URL(document.URL);
    const path = u.pathname;
    let name = "";
    if (path[path.length - 1] === "/") {
      const a = path.split("/");
      name = a[a.length - 2];
    } else {
      const a = path.split("/");
      name = a[a.length - 1];
    }
    if (name !== "") {
      this._name = name;
      if (DEBUG) console.log(`name set to ${this._name}`);
    }
  }

  private checkMatchingName(person: GrampsZod.Person) {
    if (person && person.name) {
      const nameParts: GrampsZod.NameElement[] | GrampsZod.NameElement =
        person.name;
      const last = [nameParts].flat().map((n) => {
        const s: GrampsZod.SurnameClass | string = n.surname;
        if (typeof s === "string") {
          return s.toLowerCase();
        } else {
          return s["#text"].toLowerCase();
        }
      });
      return last.includes(this._name.toLowerCase());
    }
    return false;
  }

  private getPersonsChildren(person: GrampsZod.Person) {
    const db = this.stateProvider.zodData;
    if (person && db) {
      const familyRef:
        | GrampsZod.Sourceref[]
        | GrampsZod.Sourceref
        | null
        | undefined = person.parentin;
      if (familyRef) {
        const familyArray = [familyRef].flat();
        const familyLinks = familyArray.map((f) => {
          return f.hlink;
        });
        if (familyLinks.length > 0) {
          if (DEBUG)
            console.log(`getPersonsChildren; I have families to search`);
          const stage1 = db.people.person.filter((p) => {
            if (p && p.name) {
              return this.checkMatchingName(p);
            }
            return false;
          }); //only people with the right last name
          if (DEBUG)
            console.log(
              `getPersonsChildren; stage1 ${stage1 ? stage1.length : 0} people`,
            );
          const stage2 = stage1.filter((p) => {
            if (p && p.childof) {
              return true;
            } else {
              return false;
            }
            return false;
          }); //only people who are children of *someone*
          if (DEBUG)
            console.log(
              `getPersonsChildren; stage2 ${stage2 ? stage2.length : 0} people`,
            );
          const stage3 = stage2.filter((p) => {
            if (p && p.childof) {
              if (DEBUG) console.log(`getPersonsChildren stage3; p is a child`);
              const familyRef: GrampsZod.Sourceref[] | GrampsZod.Sourceref =
                p.childof;
              const childFamArray = [familyRef].flat();
              const childLinks = childFamArray.map((c) => {
                return c.hlink;
              }); //this should be only children of the right parent.
              // I need *at least* blocks one and three because otherwise I end up grabbing children of marriages who really belong on other pages
              const results = childLinks.filter((x) => familyLinks.includes(x));
              if (results.length > 0) {
                return true;
              }
            }
            return false;
          });
          if (DEBUG)
            console.log(
              `getPersonsChildren; stage3 ${stage3 ? stage3.length : 0} people`,
            );
          if (stage3 && stage3.length > 0) {
            if (DEBUG)
              console.log(
                `getPersonsChildren; returning ${stage3.length} people`,
              );
            return stage3;
          }
          if (DEBUG) console.log(`getPersonsChildren; no families`);
        }
      }
    } else {
      console.error(`no controller`);
    }
    if (DEBUG) console.log(`found no people`);
    return null;
  }

  private getPersons() {
    const db = this.stateProvider.zodData;
    if (db) {
      if (DEBUG) console.log(`getPersons; controllers are set`);
      if (this._name && this._name !== "") {
        if (DEBUG) console.log(`getPersons; name is set`);
        const people = db.people.person
          .filter((p) => {
            if (p && p.name) {
              return this.checkMatchingName(p);
            }
            return false;
          })
          .filter((p) => {
            if (p && p.childof) {
              return false;
            } else if (p) {
              return true;
            }
            return false;
          });
        if (people && people.length > 0) {
          this._persons = people;
          this.requestUpdate("_persons");
          return people;
        }
      }
    } else {
      console.warn(`GrampsFamily getPersons without zodData`);
    }
    return null;
  }

  private renderChildLine(person: GrampsZod.Person) {
    let t = html`No Child`;
    const db = this.stateProvider.zodData;
    if (!(db && person)) {
      console.warn(`cannot render a childline without person or database`);
      return t;
    } else {
      if (this._renderedPersons && this._renderedPersons.includes(person.id)) {
        if (DEBUG) {
          console.log(`attempt to render duplciate person`);
        }
        return html``;
      }
      this._renderedPersons.push(person.id);
      if (db) {
        t = html``; //erase the temp content
        let family: GrampsZod.Family | undefined;
        if (person.parentin) {
          if (DEBUG) console.log(`renderChildLine; person is a parent`);
          const citation: GrampsZod.Sourceref[] | GrampsZod.Sourceref =
            person.parentin;
          const cArray = [citation].flat();
          family = db.families.family
            .filter((f) => {
              if (f && f.handle) {
                const links = cArray.map((c) => {
                  return c.hlink;
                });
                return links.includes(f.handle);
              }
              return false;
            })
            .shift();
          if (family && family.childref) {
            const children = this.getPersonsChildren(person);
            if (children) {
              t = html`${t}
                <ul>
                  ${children.map((p) => {
                    if (DEBUG)
                      console.log(`renderChildLine; map iteration ${p.id}`);
                    return html`${this.renderChildLine(p)}`;
                  })}
                </ul> `;
            }
          }
        }
        t = html`
          <li>
            <simple-individual
              grampsId=${person.id}
              asLink
              showBirth
              showDeath
              asRange
            ></simple-individual>
            ${t}
          </li>
        `;
      }
    }
    return html`${t}`;
  }

  static styles = [GrampsCSS];

  render() {
    this._renderedPersons = new Array<string>();
    if (DEBUG) {
      console.log(
        `GrampsFamily render start with ${this._persons?.length} person in family`,
      );
    }
    if (this._persons && this._persons.length >= 1) {
      return html`
        <ul>
          ${this._persons!.map((p, i) => {
            if (p) {
              if (DEBUG) console.log(`render; map iteration ${i} for ${p.id}`);
              return html`${this.renderChildLine(p)}`;
            } else {
              return nothing;
            }
          })}
        </ul>
      `;
    } else {
      return html` No known family members in the database.`;
    }
  }
}

customElements.define("gramps-family", GrampsFamily);
