import debugFunction from "@shared/debug";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

import { type GedcomPerson, PersonStrings } from "@hp-stuff/schemas/gedcom";

// Class for handling individual names consistently
export class IndividualName {
  private person: GedcomPerson.GedcomElement;
  private grampsId: string;

  constructor(person: GedcomPerson.GedcomElement) {
    this.person = person;
    this.grampsId = person.gramps_id;
  }

  readonly lastName = () => {
    let name = "";
    if (Array.isArray(this.person.primary_name.surname_list)) {
      let found: boolean = false;
      this.person.primary_name.surname_list.map((sn) => {
        if (sn.primary) {
          if (!sn.origintype.string.localeCompare(PersonStrings.Values.Taken)) {
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
    return name.length ? name : "Unknown";
  };

  readonly firstName = () => {
    let name = "";

    if (this.person.primary_name.first_name.length > 0) {
      name += this.person.primary_name.first_name;
    } else if (
      this.person.primary_name.nick &&
      this.person.primary_name.nick.length > 0
    ) {
      name += this.person.primary_name.nick;
    } else if (
      this.person.primary_name.call &&
      this.person.primary_name.call.length
    ) {
      name += this.person.primary_name.call;
    } else {
      name += "Unknown";
    }

    return name;
  };

  readonly suffix = () => {
    if (
      this.person.primary_name.suffix &&
      this.person.primary_name.suffix.length > 0
    ) {
      const suffix = this.person.primary_name.suffix;
      const lastName = this.lastName();
      let prefix = "";
      for (const sno of this.person.primary_name.surname_list) {
        const sn = sno.surname;
        if (!sn.localeCompare(lastName)) {
          prefix = sno.prefix.toString();
        }
      }
      if (prefix.length) {
        return `${prefix} ${suffix}`;
      } else {
        return suffix;
      }
    }
    return "";
  };

  readonly displayName = () => {
    let name = "";

    name = this.firstName();

    const sn = this.lastName();
    if (sn.length) {
      name += ` ${sn}`;
    }
    if (
      this.person.primary_name.suffix &&
      this.person.primary_name.suffix.length > 0
    ) {
      const suffix = this.suffix();
      name = `${name}${suffix.length ? ` ${suffix}` : ""}`;
    }

    return name;
  };

  readonly getIconName = () => {
    return this.person.gender === 1
      ? "ion-male"
      : this.person.gender === 0
        ? "ion-female"
        : "tdesign:user-unknown";
  };

  readonly getIconClass = () => {
    return this.person.gender === 1
      ? "color-male"
      : this.person.gender === 0
        ? "color-female"
        : "icon1";
  };

  // Get full name for display
  getFullName(): string {
    const suffix = this.suffix();
    return `${this.firstName()} ${this.lastName()}${suffix.length ? ` ${suffix}` : ""}`;
  }

  // Get filename for markdown file
  getFilename(): string {
    const lastname = this.lastName();
    const firstName = this.firstName();
    const suffix = this.suffix();

    if (lastname === "Unknown" && firstName === "Unknown") {
      return `Unknown/${this.grampsId}.md`;
    } else if (lastname === "Unknown") {
      return `Unknown/${firstName} - ${this.grampsId}.md`;
    } else if (firstName === "Unknown") {
      return `${lastname}/${this.grampsId}.md`;
    } else {
      return `${lastname}/${firstName}${suffix.length ? ` ${suffix}` : ""}.md`;
    }
  }

  // Format URL for markdown links
  formatUrlForMarkdown(base: string = ""): string {
    // Remove .md extension for URLs
    const url = this.getFilename().replace(".md", "");
    if (url.includes(" ")) {
      return `</${base}${url}/>`;
    } else return `/${base}${url}/`;
  }
}
