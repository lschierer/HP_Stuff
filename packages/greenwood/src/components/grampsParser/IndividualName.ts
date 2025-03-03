---
interface Props {
  personId: string;
  link?: boolean;
  inline?: boolean;
}

import { GedcomPerson } from "@schemas/gedcom";

import { getEntry, type CollectionEntry } from "astro:content";

import "@styles/Gramps.css";

import AstroIcon from "@components/Icon.astro";

import { male, female } from "@lib/GedcomConstants";

const DEBUG = false;

const { personId, link = false, inline = false } = Astro.props;

if (DEBUG) {
  console.log(`IndividualName.astro personId is ${personId}`);
  console.log(`IndividualName.astro link is ${link}`);
  console.log(`IndividualName.astro inline is ${inline}`);
}

const buildLinkTarget = (individual: GedcomPerson.GedcomElement): string => {
  let targetLocation = "/harrypedia/people/";

  if (individual.primary_name != undefined) {
    if (individual.primary_name.surname_list != undefined) {
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
                  `found lastname ${sn.surname} for ${personId}, targetLocation now ${targetLocation}`
                );
              }
            }
          }
        });
        if (!found && individual.primary_name.surname_list.length > 0) {
          const sn = individual.primary_name.surname_list[0].surname;
          const tsn = encodeURIComponent(sn.toLowerCase());
          targetLocation = `${targetLocation}${tsn}/`;
          if (DEBUG) {
            console.log(
              `found lastname ${sn} for ${personId}, targetLocation now ${targetLocation}`
            );
          }
        }
      }
    }

    if (
      individual.primary_name.first_name != undefined &&
      individual.primary_name.first_name.length > 0
    ) {
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
  }
  return targetLocation;
};

const displayName = (individual: GedcomPerson.GedcomElement) => {
  let name = "";
  if (individual.primary_name != undefined) {
    if (individual.primary_name.first_name != undefined) {
      name = `${individual.primary_name.first_name} `;
      if (DEBUG) {
        console.log(
          `firstname ${individual.primary_name.first_name} for ${personId}, name now ${name}`
        );
      }
    } else {
      if (DEBUG) {
        console.log(`no firstname for ${personId}`);
      }
    }

    if (individual.primary_name.surname_list != undefined) {
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
              name = `${name}${sn.surname}`;
              if (DEBUG) {
                console.log(
                  `found lastname ${sn.surname} for ${personId}, name now ${name}`
                );
              }
            }
          }
        });
        if (!found && individual.primary_name.surname_list.length > 0) {
          const sn = individual.primary_name.surname_list[0].surname;
          name = `${name}${sn}`;
          if (DEBUG) {
            console.log(
              `found lastname ${sn} for ${personId}, name now ${name}`
            );
          }
        }
      }
    }

    if (individual.primary_name.suffix != undefined) {
      name = `${name} ${individual.primary_name.suffix}`;
    }
  }
  return name;
};

let person: GedcomPerson.GedcomElement | undefined = undefined;
let name: string = "";
let iconName: string = "";
let iconColor: string = "";
if (personId) {
  const personEntry = await getEntry("people", personId);

  if (personEntry != undefined) {
    person = personEntry.data;
    name = displayName(person).trimEnd();

    if (person.gender === male.JSONconstant) {
      iconName = male.iconName;
      iconColor = male.iconColor;
    }
    if (person.gender === female.JSONconstant) {
      iconName = female.iconName;
      iconColor = female.iconColor;
    }
  }
}

const iconclasses =
  person != undefined
    ? person.gender === male.JSONconstant
      ? "color-male"
      : person.gender === female.JSONconstant
        ? "color-female"
        : "icon1"
    : "icon2";

const linkTarget = person != undefined ? buildLinkTarget(person) : "";
const nameFragmet = link
  ? `<a href="${linkTarget}">${name}</a>`
  : inline
    ? name
    : `<span class="bio">${name}</span>`;
---

{
  person != undefined ? (
    inline ? (
      <span>
        <AstroIcon icon={iconName} iconclasses={iconclasses} inline={true} />
        <Fragment set:html={nameFragmet} />
      </span>
    ) : (
      <>
        <AstroIcon icon={iconName} iconclasses={iconclasses} />
        <Fragment set:html={nameFragmet} />
      </>
    )
  ) : (
    ""
  )
}
