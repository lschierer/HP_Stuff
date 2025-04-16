import debugFunction from "@shared/debug";

const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

import { male, female } from "./GedcomConstants";

import { GedcomPerson } from "@hp-stuff/schemas/gedcom";

import "iconify-icon";

export default class IndividualName {
  accessor grampsId: string = "";
  accessor link: boolean = false;
  accessor inline = false;
  accessor icon: boolean = true;

  private person: GedcomPerson.GedcomElement | null = null;

  constructor(person: GedcomPerson.GedcomElement) {
    this.person = person;
    this.grampsId = person.gramps_id;
  }

  readonly buildLinkTarget = (): string => {
    let targetLocation = "/Harrypedia/people/";

    if (this.person) {
      const sn = this.lastName();
      if (sn.length) {
        targetLocation += `${sn}/`;
      } else {
        targetLocation += `Unknown/`;
      }

      let isUnknownFirstName = false;

      if (this.person.primary_name.first_name.length > 0) {
        const fn = this.person.primary_name.first_name;
        targetLocation = `${targetLocation}${fn}`;
      } else if (
        this.person.primary_name.nick &&
        this.person.primary_name.nick.length > 0
      ) {
        const fn = this.person.primary_name.nick;
        targetLocation = `${targetLocation}${fn}`;
      } else if (
        this.person.primary_name.call &&
        this.person.primary_name.call.length
      ) {
        targetLocation += this.person.primary_name.call;
      } else {
        // For unknown first names, use the ID to make the URL unique
        isUnknownFirstName = true;
        targetLocation += `Unknown-${this.person.id}`;
      }

      if (
        this.person.primary_name.suffix &&
        this.person.primary_name.suffix.length > 0 &&
        !isUnknownFirstName // Don't add suffix for unknown first names with ID
      ) {
        const suffix = this.person.primary_name.suffix;
        let prefix: string = this.person.primary_name.surname_list[0].prefix;
        prefix = !prefix.localeCompare("of") ? "of " : prefix;
        targetLocation = `${targetLocation} ${prefix}${suffix}`;
      }
      targetLocation = `${targetLocation}/`;
    }

    return targetLocation.replaceAll("//", "/");
  };

  readonly lastName = () => {
    let name = "";
    if (this.person && Array.isArray(this.person.primary_name.surname_list)) {
      let found: boolean = false;
      this.person.primary_name.surname_list.map((sn) => {
        if (sn.primary) {
          if (
            !sn.origintype.string.localeCompare(
              GedcomPerson.PersonStrings.Values.Taken
            )
          ) {
            found = true;
            const prefix = !sn.prefix.localeCompare("of") ? "of " : sn.prefix;
            name = `${name}${prefix}${sn.surname}`;
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
        let prefix: string = this.person.primary_name.surname_list[0].prefix;
        prefix = !prefix.localeCompare("of") ? "of " : prefix;
        const sn = this.person.primary_name.surname_list[0].surname;
        name = `${name}${prefix}${sn}`;
        if (DEBUG) {
          console.log(
            `found lastname ${sn} for ${this.grampsId}, name now ${name}`
          );
        }
      }
    }
    return name;
  };

  readonly firstName = (suffix: boolean = true) => {
    let name = "";

    if (this.person && this.person.primary_name.first_name.length > 0) {
      name += this.person.primary_name.first_name;
    } else if (
      this.person &&
      this.person.primary_name.nick &&
      this.person.primary_name.nick.length > 0
    ) {
      name += this.person.primary_name.nick;
    } else if (
      this.person &&
      this.person.primary_name.call &&
      this.person.primary_name.call.length
    ) {
      name += this.person.primary_name.call;
    } else {
      name += "Unknown";
    }
    if (
      suffix &&
      this.person &&
      this.person.primary_name.suffix &&
      this.person.primary_name.suffix.length > 0
    ) {
      const suffix = this.person.primary_name.suffix;
      let prefix: string = this.person.primary_name.surname_list[0].prefix;
      prefix = !prefix.localeCompare("of") ? "of " : prefix;
      name = `${name} ${prefix}${suffix}`;
    }
    return name;
  };

  readonly displayName = () => {
    let name = "";
    if (this.person) {
      name = this.firstName(false);

      const sn = this.lastName();
      if (sn.length) {
        name += ` ${sn}`;
      }
      if (
        this.person.primary_name.suffix &&
        this.person.primary_name.suffix.length > 0
      ) {
        const suffix = this.person.primary_name.suffix;
        let prefix: string = this.person.primary_name.surname_list[0].prefix;
        prefix = !prefix.localeCompare("of") ? "of " : prefix;
        name = `${name} ${prefix}${suffix}`;
      }
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
}
