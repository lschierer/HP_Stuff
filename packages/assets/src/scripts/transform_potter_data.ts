import fs from "fs";
import path from "path";

import type {
  GedcomEvent,
  GedcomFamily,
  GedcomPerson,
  EventRefList,
} from "@hp-stuff/schemas/gedcom";

import { type NavigationItem } from "@hp-stuff/schemas";

// Import the filtered Potter Data
import {
  persons,
  events,
  families,
  findPersonByHandle,
} from "./import_potter_data";
import { IndividualName } from "./IndividualName";

//Default page base within the relative to *both* src and dest directories for the content
let pageBase = "Harrypedia/people";

// Function to ensure directory exists
function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Function to create markdown content for a person
function createPersonMarkdown(
  person: GedcomPerson.GedcomElement,
  persons: GedcomPerson.GedcomElement[],
  families: GedcomFamily.GedcomElement[],
  events: GedcomEvent.GedcomElement[]
): string {
  const name = new IndividualName(person);

  // Add front matter compatible with gray-matter
  let markdown = `---
title: >-
  ${name.getFullName()}
gramps_id: ${person.gramps_id}
layout: standard
collection:
  - Harrypedia
  - person
  - ${name.lastName()}
---

\n`;

  // Add basic information
  markdown += `## Basic Information\n\n`;
  markdown += `- **ID**: ${person.gramps_id}\n`;
  markdown += `- **Gender**: ${person.gender === 0 ? "Female" : person.gender === 1 ? "Male" : "Unknown"}\n\n`;

  // Add events (birth, death, etc.)
  if (person.event_ref_list.length > 0) {
    markdown += `## Events\n\n`;

    person.event_ref_list.forEach((eventRef: EventRefList) => {
      const event = events.find((e) => e.handle === eventRef.ref);
      if (event) {
        markdown += `- **${event.type.string}**: `;
        if (event.date && event.date.text) {
          markdown += event.date.text;
        }
        if (event.description) {
          markdown += ` - ${event.description}`;
        }
        markdown += "\n";
      }
    });
    markdown += "\n";
  }

  // Add family relationships
  if (person.family_list.length > 0) {
    markdown += `## Families\n\n`;

    person.family_list.forEach((familyHandle: string) => {
      const family = families.find((f) => f.handle === familyHandle);
      if (family) {
        // Determine if this person is father or mother in the family
        const isFather = family.father_handle === person.handle;
        const isMother = family.mother_handle === person.handle;

        if (isFather || isMother) {
          markdown += `### ${family.type.string || "Family"}\n\n`;

          // Add spouse information
          const spouseHandle = isFather
            ? family.mother_handle
            : family.father_handle;
          if (spouseHandle) {
            const spouse = findPersonByHandle(spouseHandle);
            if (spouse) {
              const spouseName = new IndividualName(spouse);
              markdown += `- **Spouse**: [${spouseName.getFullName()}](${spouseName.formatUrlForMarkdown(`${pageBase}/`)})\n`;
            }
          }

          // Add children
          if (family.child_ref_list.length > 0) {
            markdown += `- **Children**:\n`;
            family.child_ref_list.forEach((childRef) => {
              const child = findPersonByHandle(childRef.ref);
              if (child) {
                const childName = new IndividualName(child);
                markdown += `  - [${childName.getFullName()}](${childName.formatUrlForMarkdown(`${pageBase}/`)})\n`;
              }
            });
          }
          markdown += "\n";
        }
      }
    });
  }

  // Add parent families
  if (person.parent_family_list.length > 0) {
    markdown += `## Parents\n\n`;

    person.parent_family_list.forEach((familyHandle: string) => {
      const family = families.find((f) => f.handle === familyHandle);
      if (family) {
        markdown += `- **Family**: ${family.type.string || "Family"}\n`;

        // Add father and mother information
        if (family.father_handle) {
          const father = findPersonByHandle(family.father_handle);
          if (father) {
            const fatherName = new IndividualName(father);
            markdown += `  - **Father**: [${fatherName.getFullName()}](${fatherName.formatUrlForMarkdown(`${pageBase}/`)})\n`;
          }
        }

        if (family.mother_handle) {
          const mother = findPersonByHandle(family.mother_handle);
          if (mother) {
            const motherName = new IndividualName(mother);
            markdown += `  - **Mother**: [${motherName.getFullName()}](${motherName.formatUrlForMarkdown(`${pageBase}/`)})\n`;
          }
        }
        markdown += "\n";
      }
    });
  }

  return markdown;
}

// Function to create family tree structure for a last name
function createFamilyTree(
  lastName: string,
  persons: GedcomPerson.GedcomElement[]
): string {
  const personsWithLastName = persons.filter((person) => {
    const name = new IndividualName(person);
    return name.lastName() === lastName;
  });

  // Find potential root persons (those without parents or with parents of different last names)
  const rootPersons = personsWithLastName.filter((person) => {
    for (const familyHandle of person.parent_family_list) {
      const family = families.find((f) => f.handle === familyHandle);
      if (family) {
        const father = findPersonByHandle(family.father_handle ?? "");
        if (father) {
          const fatherName = new IndividualName(father);
          if (fatherName.lastName() === lastName) {
            return false; // has a father with the same last name → not a root
          }
        }
      }
    }
    return true;
  });

  // Add front matter compatible with gray-matter
  let markdown = `---
title: >-
  ${lastName} Family
gramps_id: >-
  family-${lastName}
layout: standard
collection:
  - Harrypedia
  - family
---

# ${lastName} Family\n\n`;

  // Create nested list for each root person
  for (const rootPerson of rootPersons) {
    markdown += buildFamilyTreeMarkdown(rootPerson, persons, 0);
  }

  return markdown;
}

// Helper function to build nested family tree markdown
function buildFamilyTreeMarkdown(
  person: GedcomPerson.GedcomElement,
  persons: GedcomPerson.GedcomElement[],
  depth: number
): string {
  const name = new IndividualName(person);
  let markdown = `${"  ".repeat(depth)}- [${name.getFullName()}](${name.formatUrlForMarkdown(`${pageBase}/`)})\n`;

  // Find children where this person is a parent
  const personFamilies = families.filter(
    (family) =>
      family.father_handle === person.handle ||
      family.mother_handle === person.handle
  );

  for (const family of personFamilies) {
    if (family.child_ref_list.length > 0) {
      for (const childRef of family.child_ref_list) {
        const child = findPersonByHandle(childRef.ref);
        if (child) {
          const childName = new IndividualName(child);

          // Only include children with the same last name under the father if both exist
          if (childName.lastName() === name.lastName()) {
            const father = findPersonByHandle(family.father_handle ?? "");
            if (father && father.handle !== person.handle) {
              continue; // handled under father's tree
            }
            markdown += buildFamilyTreeMarkdown(child, persons, depth + 1);
          }
        }
      }
    }
  }

  return markdown;
}

const pagesCreated = (pageRoots: NavigationItem[]) => {
  const fileList = new Array<string>();
  for (const page of pageRoots) {
    fileList.push(page.fileName);
    if (page.children.length) {
      fileList.push(...pagesCreated(page.children));
    }
  }
  return fileList;
};

// Main function to process the data
export const doConversion = (
  outputDir: string,
  staticContentDir: string,
  assetContentDir: string,
  pageBaseOveride?: string
) => {
  if (pageBaseOveride !== undefined) {
    pageBase = pageBaseOveride;
  }
  // data is imported from ./import_potter_data
  console.log(
    `Found ${events.length} Events, ${families.length} Families, and ${persons.length} Persons`
  );

  // Ensure output directory exists
  ensureDirectoryExists(outputDir);

  // Create navigation structure
  const returnPages: NavigationItem[] = [];
  const lastNames = new Set<string>();

  // Process each person
  for (const person of persons) {
    const name = new IndividualName(person);
    lastNames.add(name.lastName());

    // Create directory for last name if it doesn't exist
    const lastNameDir = path.join(outputDir, name.lastName());
    ensureDirectoryExists(lastNameDir);

    // Create markdown file for person
    const markdownContent = createPersonMarkdown(
      person,
      persons,
      families,
      events
    );
    const outputFilePath = path.join(outputDir, name.getFilename());

    let finalContent = markdownContent;

    // Check if there is an SVG to append
    let SVGContentPath = path.join(
      assetContentDir,
      pageBase,
      `${name.getFilename().slice(0, -3)}.svg`
    );
    if (fs.existsSync(SVGContentPath)) {
      SVGContentPath = SVGContentPath.replace(assetContentDir, "");
      SVGContentPath = SVGContentPath.startsWith("/")
        ? `/assets${SVGContentPath}`
        : `/assets/${SVGContentPath}`;
      SVGContentPath = SVGContentPath.includes(" ")
        ? `<${SVGContentPath}>`
        : SVGContentPath;
      finalContent += "\n" + `TREE-CHART:  ${SVGContentPath}`;
    }

    // Check if there's static content to append
    const staticContentPath = path.join(staticContentDir, name.getFilename());

    if (fs.existsSync(staticContentPath)) {
      const staticContent = fs.readFileSync(staticContentPath, "utf8");
      finalContent += "\n\n---\n\n" + staticContent;
    }

    // Write the markdown file
    fs.writeFileSync(outputFilePath, finalContent);
  }

  // Create index files for each last name
  for (const lastName of lastNames) {
    // Create family tree markdown
    const familyTreeMarkdown = createFamilyTree(lastName, persons);
    const indexFilePath = path.join(outputDir, lastName, "index.md");

    // Check if there's static content to append
    const staticIndexPath = path.join(staticContentDir, lastName, "index.md");
    let finalContent = familyTreeMarkdown;

    if (fs.existsSync(staticIndexPath)) {
      const staticContent = fs.readFileSync(staticIndexPath, "utf8");
      finalContent += "\n\n---\n\n" + staticContent;
    }
    // Write the index file
    fs.writeFileSync(indexFilePath, finalContent);

    // Add to navigation items
    const familyNavItem: NavigationItem = {
      title: `${lastName} Family`,
      fileName: indexFilePath,
      route: `/${pageBase}/${lastName}/`,
      children: [],
    };

    // Add person pages to navigation
    const personsWithLastName = persons.filter((person) => {
      const personName = new IndividualName(person);
      return personName.lastName() === lastName;
    });

    for (const person of personsWithLastName) {
      const personName = new IndividualName(person);
      const personFileName = path.join(outputDir, personName.getFilename());
      familyNavItem.children.push({
        title: personName.getFullName(),
        fileName: personFileName,
        route: personName.formatUrlForMarkdown(`${pageBase}/`),
        children: [],
      });
    }

    returnPages.push(familyNavItem);
  }

  // Create routes directory and write navigation data
  const routesDir = path.join(process.cwd(), "dist", "routes", pageBase);
  ensureDirectoryExists(routesDir);
  fs.writeFileSync(
    path.join(routesDir, "index.json"),
    JSON.stringify(returnPages, null, 2)
  );

  console.log("Transform Potter Universe Gedcom Data Complete!");
  return pagesCreated(returnPages);
};
