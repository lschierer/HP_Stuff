import { GedcomPerson } from "../../schemas/gedcom/index.ts";

import GrampsCSS from "../../styles/Gramps.css" with { type: "css" };

import "iconify-icon";

import { male, female } from "../../lib/GedcomConstants.ts";

import debugFunction from "../../lib/debug.ts";

const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

import GrampsState from "./state.ts";

export default class IndividualName extends HTMLElement {
  private personId: string = "";
  private link: boolean = false;
  private inline = false;

  private person: GedcomPerson.GedcomElement | null = null;

  protected getAttributes = () => {
    for (const attr of this.attributes) {
      if (!attr.name.toLowerCase().localeCompare("personid")) {
        this.personId = attr.value;
      } else if (!attr.name.localeCompare("link")) {
        this.link = true;
      } else if (!attr.name.localeCompare("inline")) {
        this.inline = true;
      }
    }

    if (DEBUG) {
      console.log(`IndividualName getAttributes personId is ${this.personId}`);
      console.log(`IndividualName getAttributes link is ${this.link}`);
      console.log(`IndividualName getAttributes inline is ${this.inline}`);
    }
  };

  protected buildLinkTarget = (
    individual: GedcomPerson.GedcomElement
  ): string => {
    let targetLocation = "/Harrypedia/people/";

    if (Array.isArray(individual.primary_name.surname_list)) {
      let found = false;
      individual.primary_name.surname_list.map((sn) => {
        if (sn.primary) {
          if (
            !sn.origintype.string.localeCompare(
              GedcomPerson.StringEnum.Values.Taken
            )
          ) {
            found = true;
            const tsn = encodeURIComponent(sn.surname);
            targetLocation = `${targetLocation}/${tsn}/`;
            if (DEBUG) {
              console.log(
                `found lastname ${sn.surname} for ${this.personId}, targetLocation now ${targetLocation}`
              );
            }
          }
        }
      });
      /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */
      if (!found && individual.primary_name.surname_list.length > 0) {
        const sn = individual.primary_name.surname_list[0].surname;
        const tsn = encodeURIComponent(sn);
        targetLocation = `${targetLocation}${tsn}/`;
        if (DEBUG) {
          console.log(
            `found lastname ${sn} for ${this.personId}, targetLocation now ${targetLocation}`
          );
        }
      }
    }

    if (individual.primary_name.first_name.length > 0) {
      const fn = individual.primary_name.first_name.replaceAll(" ", "_");
      targetLocation = `${targetLocation}${fn}`;
    } else if (
      individual.primary_name.nick &&
      individual.primary_name.nick.length > 0
    ) {
      const fn = individual.primary_name.nick.replaceAll(" ", "_");
      targetLocation = `${targetLocation}${fn}`;
    }
    if (
      individual.primary_name.suffix &&
      individual.primary_name.suffix.length > 0
    ) {
      const suffix = individual.primary_name.suffix.replaceAll(" ", "_");
      targetLocation = `${targetLocation}_${suffix}`;
    }
    targetLocation = `${targetLocation}/`;
    return targetLocation;
  };

  protected displayName = (individual: GedcomPerson.GedcomElement) => {
    let name = "";
    name = `${individual.primary_name.first_name} `;
    if (DEBUG) {
      console.log(
        `firstname ${individual.primary_name.first_name} for ${this.personId}, name now ${name}`
      );
    }

    if (Array.isArray(individual.primary_name.surname_list)) {
      let found: boolean = false;
      individual.primary_name.surname_list.map((sn) => {
        if (sn.primary) {
          if (
            !sn.origintype.string.localeCompare(
              GedcomPerson.StringEnum.Values.Taken
            )
          ) {
            found = true;
            name = `${name}${sn.surname}`;
            if (DEBUG) {
              console.log(
                `found lastname ${sn.surname} for ${this.personId}, name now ${name}`
              );
            }
          }
        }
      });
      /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */
      if (!found && individual.primary_name.surname_list.length > 0) {
        const sn = individual.primary_name.surname_list[0].surname;
        name = `${name}${sn}`;
        if (DEBUG) {
          console.log(
            `found lastname ${sn} for ${this.personId}, name now ${name}`
          );
        }
      }
    }

    name = `${name} ${individual.primary_name.suffix}`;
    return name;
  };

  protected getGrampsData = async () => {
    const personResponse = await fetch(
      new URL(`/api/gedcom/person?id=${this.personId}`, import.meta.url)
    );
    if (personResponse.ok) {
      const data = (await personResponse.json()) as object;
      const valid = GedcomPerson.GedcomElement.safeParse(data);
      if (valid.success) {
        this.person = valid.data;
      } else {
        if (DEBUG) {
          console.warn(`retrieved invalid person`, valid.error.message);
        }
      }
    } else {
      if (DEBUG) {
        console.warn(
          `error fetchign person`,
          personResponse.status,
          personResponse.statusText
        );
      }
    }
  };

  async connectedCallback() {
    this.attachShadow({ mode: "open" });
    if (this.shadowRoot) {
      this.shadowRoot.adoptedStyleSheets.push(GrampsCSS);
      this.getAttributes();
      if (this.personId.length > 0) {
        if (GrampsState.people.length == 0) {
          await this.getGrampsData();
        } else {
          if (this.personId.length > 0) {
            this.person =
              GrampsState.people.find((p) => {
                return !p.id.localeCompare(this.personId);
              }) ?? GrampsState.people[0];
          } else {
            this.person = GrampsState.people[0];
          }
        }
        if (this.person) {
          const name = this.displayName(this.person).trimEnd();
          const iconName =
            this.person.gender === male.JSONconstant
              ? "ion-male"
              : this.person.gender === female.JSONconstant
                ? "ion-female"
                : "tdesign:user-unknown";
          const iconclasses =
            this.person.gender === male.JSONconstant
              ? "color-male"
              : this.person.gender === female.JSONconstant
                ? "color-female"
                : "icon1";
          const linkTarget = this.buildLinkTarget(this.person);
          const nameFragmet = this.link
            ? `<a href="${linkTarget}">${name}</a>`
            : this.inline
              ? name
              : `<span class="bio">${name}</span>`;
          if (this.inline) {
            this.shadowRoot.innerHTML = `
                  <span>
                    <iconify-icon icon=${iconName} class=${iconclasses} inline ></iconify-icon>
                    ${nameFragmet}
                  </span>
                `;
          } else {
            this.shadowRoot.innerHTML = `
                  <iconify-icon icon=${iconName} iconclasses=${iconclasses} ></iconify-icon>
                  ${nameFragmet}
                `;
          }
        }
      } else {
        if (DEBUG) {
          console.warn(
            `IndividualName connectedCallback has no personId after getAttributes call`
          );
        }
      }
    }
  }
}
customElements.define("individual-name", IndividualName);
