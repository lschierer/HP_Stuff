import debugFunction from "../../lib/debug.ts";

const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

import { male, female } from "../../lib/GedcomConstants.ts";

import { GedcomPerson } from "../../schemas/gedcom/index.ts";

import { GrampsState, getGrampsData } from "./state.ts";

import GrampsCSS from "../../styles/Gramps.css" with { type: "css" };

import "iconify-icon";

export default class IndividualName extends HTMLElement {
  accessor grampsId: string = "";
  accessor link: boolean = false;
  accessor inline = false;
  accessor icon: boolean = true;

  private person: GedcomPerson.GedcomElement | null = null;

  constructor(id: string) {
    super();

    this.grampsId = id;

    if (GrampsState.people.has(this.grampsId)) {
      const p = GrampsState.people.get(this.grampsId);
      if (p) {
        this.person = p;
      }
    } else {
      void this.initialize();
    }
  }

  protected getAttributes = () => {
    for (const attr of this.attributes) {
      if (!attr.name.toLowerCase().localeCompare("personid")) {
        this.grampsId = attr.value;
      } else if (!attr.name.localeCompare("link")) {
        this.link = true;
      } else if (!attr.name.localeCompare("inline")) {
        this.inline = true;
      } else if (!attr.name.toLocaleLowerCase().localeCompare("noicon")) {
        this.icon = false;
      }
    }

    if (DEBUG) {
      console.log(`IndividualName getAttributes personId is ${this.grampsId}`);
      console.log(`IndividualName getAttributes link is ${this.link}`);
      console.log(`IndividualName getAttributes inline is ${this.inline}`);
    }
  };

  protected initialize = async () => {
    await getGrampsData();
    const p = GrampsState.people.get(this.grampsId);
    if (p) {
      this.person = p;
    }
  };

  readonly buildLinkTarget = (): string => {
    let targetLocation = "/Harrypedia/people/";

    if (this.person) {
      if (Array.isArray(this.person.primary_name.surname_list)) {
        let found = false;
        this.person.primary_name.surname_list.map((sn) => {
          if (sn.primary && this.person) {
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
                  `found lastname ${sn.surname} for ${this.person.id}, targetLocation now ${targetLocation}`
                );
              }
            }
          }
        });
        /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */
        if (!found && this.person.primary_name.surname_list.length > 0) {
          const sn = this.person.primary_name.surname_list[0].surname;
          const tsn = encodeURIComponent(sn);
          targetLocation = `${targetLocation}${tsn}/`;
          if (DEBUG) {
            console.log(
              `found lastname ${sn} for ${this.grampsId}, targetLocation now ${targetLocation}`
            );
          }
        }
      }

      if (this.person.primary_name.first_name.length > 0) {
        const fn = this.person.primary_name.first_name;
        targetLocation = `${targetLocation}${fn}`;
      } else if (
        this.person.primary_name.nick &&
        this.person.primary_name.nick.length > 0
      ) {
        const fn = this.person.primary_name.nick;
        targetLocation = `${targetLocation}${fn}`;
      }
      if (
        this.person.primary_name.suffix &&
        this.person.primary_name.suffix.length > 0
      ) {
        const suffix = this.person.primary_name.suffix;
        targetLocation = `${targetLocation} ${suffix}`;
      }
      targetLocation = `${targetLocation}/`;
    }

    return targetLocation;
  };

  readonly displayName = () => {
    let name = "";
    if (this.person) {
      name = `${this.person.primary_name.first_name} `;
      if (DEBUG) {
        console.log(
          `firstname ${this.person.primary_name.first_name} for ${this.grampsId}, name now ${name}`
        );
      }

      if (Array.isArray(this.person.primary_name.surname_list)) {
        let found: boolean = false;
        this.person.primary_name.surname_list.map((sn) => {
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
                  `found lastname ${sn.surname} for ${this.grampsId}, name now ${name}`
                );
              }
            }
          }
        });
        /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */
        if (!found && this.person.primary_name.surname_list.length > 0) {
          const sn = this.person.primary_name.surname_list[0].surname;
          name = `${name}${sn}`;
          if (DEBUG) {
            console.log(
              `found lastname ${sn} for ${this.grampsId}, name now ${name}`
            );
          }
        }
      }

      name = `${name} ${this.person.primary_name.suffix}`;
    }

    return name;
  };

  readonly getIconName = () => {
    return this.person
      ? this.person.gender === male.JSONconstant
        ? "ion-male"
        : this.person.gender === female.JSONconstant
          ? "ion-female"
          : "tdesign:user-unknown"
      : "tdesign:user-unknown";
  };

  readonly getIconClass = () => {
    return this.person
      ? this.person.gender === male.JSONconstant
        ? "color-male"
        : this.person.gender === female.JSONconstant
          ? "color-female"
          : "icon1"
      : "icon1";
  };

  readonly getNameAsHtml = () => {
    const name = this.displayName().trimEnd();
    const linkTarget = this.buildLinkTarget();
    const nameFragmet = this.link
      ? `<a href="${linkTarget}">${name}</a>`
      : this.inline
        ? name
        : `<span class="bio spectrum-Heading spectrum-Heading--serif spectrum-Heading--sizeL spectrum-Heading--heavy">${name}</span>`;
    if (this.icon) {
      const iconName = this.getIconName();
      const iconclasses = this.getIconClass();

      if (this.inline) {
        return `
                <span>
                  <iconify-icon icon=${iconName} class=${iconclasses} inline ></iconify-icon>
                  ${nameFragmet}
                </span>
              `;
      } else {
        return `
                <iconify-icon icon=${iconName} class=${iconclasses} height="75%" ></iconify-icon>
                ${nameFragmet}
              `;
      }
    } else {
      return nameFragmet;
    }
  };

  async connectedCallback() {
    document.adoptedStyleSheets.push(GrampsCSS);
    this.getAttributes();
    if (this.grampsId.length > 0) {
      if (GrampsState.people.size == 0) {
        await this.initialize();
      } else {
        const tempP = GrampsState.people.get(this.grampsId);
        if (tempP) {
          this.person = tempP;
        } else {
          this.person = GrampsState.people.entries().next().value as Array<
            number | GedcomPerson.GedcomElement
          >[1] as GedcomPerson.GedcomElement;
        }
      }
    } else {
      this.person = GrampsState.people.entries().next().value as Array<
        number | GedcomPerson.GedcomElement
      >[1] as GedcomPerson.GedcomElement;
    }
    if (this.person) {
      this.innerHTML = this.getNameAsHtml();
    }
  }
}
customElements.define("individual-name", IndividualName);
