import { GedcomPerson } from "../../schemas/gedcom/index.ts";

import GrampsCSS from "../../styles/Gramps.css" with { type: "css" };

import "iconify-icon";

import { male, female } from "../../lib/GedcomConstants.ts";

import debugFunction from "../../lib/debug.ts";

const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

export default class IndividualName extends HTMLElement {
  private personId: string = "";
  private link: boolean = false;
  private inline = false;

  protected getAttributes = () => {
    for (const attr of this.attributes) {
      if (!attr.name.localeCompare("personId")) {
        this.personId = attr.value;
      } else if (!attr.name.localeCompare("link")) {
        this.link = true;
      } else if (!attr.name.localeCompare("inline")) {
        this.inline = true;
      }
    }

    if (DEBUG) {
      console.log(`IndividualName.astro personId is ${this.personId}`);
      console.log(`IndividualName.astro link is ${this.link}`);
      console.log(`IndividualName.astro inline is ${this.inline}`);
    }
  };

  protected buildLinkTarget = (
    individual: GedcomPerson.GedcomElement
  ): string => {
    let targetLocation = "/harrypedia/people/";

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
            const tsn = encodeURIComponent(sn.surname.toLowerCase());
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
        const tsn = encodeURIComponent(sn.toLowerCase());
        targetLocation = `${targetLocation}${tsn}/`;
        if (DEBUG) {
          console.log(
            `found lastname ${sn} for ${this.personId}, targetLocation now ${targetLocation}`
          );
        }
      }
    }

    if (individual.primary_name.first_name.length > 0) {
      const fn = individual.primary_name.first_name
        .toLowerCase()
        .replaceAll(" ", "_");
      targetLocation = `${targetLocation}${fn}`;
    } else if (
      individual.primary_name.nick &&
      individual.primary_name.nick.length > 0
    ) {
      const fn = individual.primary_name.nick
        .toLowerCase()
        .replaceAll(" ", "_");
      targetLocation = `${targetLocation}${fn}`;
    }
    if (
      individual.primary_name.suffix &&
      individual.primary_name.suffix.length > 0
    ) {
      const suffix = individual.primary_name.suffix
        .toLowerCase()
        .replaceAll(" ", "_");
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

  async connectedCallback() {
    this.attachShadow({ mode: "open" });
    if (this.shadowRoot) {
      this.shadowRoot.adoptedStyleSheets.push(GrampsCSS);
      this.getAttributes();
      if (this.personId.length > 0) {
        const personResponse = await fetch(
          new URL(`/api/person?id=${this.personId}`, import.meta.url)
        );
        if (personResponse.ok) {
          const data = personResponse.json();
          const valid = GedcomPerson.GedcomElement.safeParse(data);
          if (valid.success) {
            const person = valid.data;
            const name = this.displayName(person).trimEnd();

            const iconName =
              person.gender === male.JSONconstant
                ? "ion-male"
                : person.gender === male.JSONconstant
                  ? "ion-female"
                  : "tdesign:user-unknown";

            const iconclasses =
              person.gender === male.JSONconstant
                ? "color-male"
                : person.gender === female.JSONconstant
                  ? "color-female"
                  : "icon1";

            const linkTarget = this.buildLinkTarget(person);
            const nameFragmet = this.link
              ? `<a href="${linkTarget}">${name}</a>`
              : this.inline
                ? name
                : `<span class="bio">${name}</span>`;

            if (this.inline) {
              this.shadowRoot.innerHTML = `
                <span>
                  <iconify-icon icon=${iconName} iconclasses=${iconclasses} inline ></iconify-icon>
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
        }
      }
    }
  }
}
customElements.define("individual-name", IndividualName);
