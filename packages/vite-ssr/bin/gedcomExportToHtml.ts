import * as fs from "fs";

import { pathToFileURL } from "url";

import debugFunction from "../src/shared/debug";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);

import { type GedcomPerson } from "../src/schemas/gedcom/index";
import { NavigatonItem } from "../src/schemas/routes";
import {
  GrampsState,
  getGrampsData,
  findFatherForChild,
  findMotherForChild,
  findPersonByHandle,
} from "../src/shared/gedcom/state";

const redirectBody = (
  person: GedcomPerson.GedcomElement,
  targetRoute: string
) => {
  const returnable = `
    <head>
      <meta http-equiv="Refresh" content="0; URL=${targetRoute}" />
    </head>
    <body>
      <p>Redirecting to <a href="${targetRoute}">${targetRoute}</a></p>
    </body>
  `;
  if (DEBUG) {
    console.log(`redirect body for ${person.id} is ${returnable}`);
  }
  return returnable;
};

const personBody = (
  person: GedcomPerson.GedcomElement,
  route: string,
  fullPage: boolean = false
) => {
  if (DEBUG) {
    console.log(`body function for ${person.id}`);
  }
  let returnable = "";
  const basePath = `${process.cwd()}/../../assets/people/`;

  if (DEBUG) {
    returnable += `
      <span class="debug">fragment for ${person.id}</span>
    `;
  }

  if (fullPage) {
    const siteSection = "/Harrypedia/people/";
    const myPath = `${basePath}${route.slice(siteSection.length, -1)}.md`;
    const myPathUrl = pathToFileURL(myPath);
    if (DEBUG) {
      console.log(`looking for file ${myPath}, ${myPathUrl.toString()}`);
    }

    if (fs.existsSync(myPath)) {
      const fileText = fs.readFileSync(myPathUrl, "utf8");
      returnable += markdownTextProcessing(fileText);
    } else {
      returnable += DEBUG
        ? `<span class="debug">body for ${person.id}</span>`
        : `<span class="spectrum-Body spectrum-Body--serif">This is a placeholder page</span>`;
    }

    returnable = `
      <div class="bio">
        <person-section
          grampsId="${person.id}"
          ></person-section>
      </div>
      <div class="content">
        <h3 class="spectrum-Heading spectrum-Heading--serif spectrum-Heading--heavy spectrum-Heading--sizeL">Facts</h3>
        ${returnable}
      </div>
    `;
  } else {
    returnable += `
        <gramps-individual
          personid="${person.id}"
        ></gramps-individual>
      `;
  }
  return returnable;
};

const doConversion = async () => {
  const returnPages = new Array<NavigatonItem>();
  await getGrampsData();
  if (!GrampsState.people.size) {
    if (DEBUG) {
      console.log(
        `failed to set GrampsState for provider anon in GedcomPeopleSourcePlugin`
      );
    }
    throw new Error(`failed to populate GrampsState.people`);
  }
};

await doConversion();
