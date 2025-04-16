import fs from "fs";
import path from "path";
import type {
  GedcomEvent,
  GedcomFamily,
  GedcomPerson,
  EventRefList,
} from "@hp-stuff/schemas/gedcom";

// Interface for navigation items
interface NavigationItem {
  name: string;
  path: string;
  children: NavigationItem[];
}

// Class for handling individual names consistently
class IndividualName {
  firstName: string;
  lastName: string;
  suffix: string;
  grampsId: string;

  constructor(person: GedcomPerson.GedcomElement) {
    // Extract name components from the person object
    const primaryName = person.primary_name;
    const surnameList = primaryName.surname_list;
    const mainSurname =
      surnameList.length > 0 ? surnameList[0].surname : "Unknown";

    this.firstName = primaryName.first_name || "Unknown";
    this.lastName = mainSurname;
    this.suffix = primaryName.suffix || "";
    this.grampsId = person.gramps_id || "";
  }

  // Get full name for display
  getFullName(): string {
    if (this.suffix) {
      return `${this.firstName} ${this.lastName} ${this.suffix}`;
    }
    return `${this.firstName} ${this.lastName}`;
  }

  // Get filename for markdown file
  getFilename(): string {
    if (this.lastName === "Unknown" && this.firstName === "Unknown") {
      return `Unknown/${this.grampsId}.md`;
    } else if (this.lastName === "Unknown") {
      return `Unknown/${this.firstName} - ${this.grampsId}.md`;
    } else if (this.firstName === "Unknown") {
      return `${this.lastName}/${this.grampsId}.md`;
    } else {
      const suffixPart = this.suffix ? ` ${this.suffix}` : "";
      return `${this.lastName}/${this.firstName}${suffixPart}.md`;
    }
  }

  // Format URL for markdown links
  formatUrlForMarkdown(): string {
    // Remove .md extension for URLs
    return this.getFilename().replace(".md", "");
  }
}

// Import the filtered Potter Data
import { persons, events, families } from "./import_potter_data";

// Function to ensure directory exists
function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Function to find a person by handle
function findPersonByHandle(
  handle: string,
  persons: GedcomPerson.GedcomElement[]
): GedcomPerson.GedcomElement | undefined {
  return persons.find((p) => p.handle === handle);
}

// Function to create markdown content for a person
function createPersonMarkdown(
  person: GedcomPerson.GedcomElement,
  persons: GedcomPerson.GedcomElement[],
  families: GedcomFamily.GedcomElement[],
  events: GedcomEvent.GedcomElement[]
): string {
  const name = new IndividualName(person);
  let markdown = `# ${name.getFullName()}\n\n`;

  // Add basic information
  markdown += `## Basic Information\n\n`;
  markdown += `- **ID**: ${person.id}\n`;
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
            const spouse = findPersonByHandle(spouseHandle, persons);
            if (spouse) {
              const spouseName = new IndividualName(spouse);
              markdown += `- **Spouse**: [${spouseName.getFullName()}](/${spouseName.formatUrlForMarkdown()})\n`;
            }
          }

          // Add children
          if (family.child_ref_list.length > 0) {
            markdown += `- **Children**:\n`;
            family.child_ref_list.forEach((childRef) => {
              const child = findPersonByHandle(childRef.ref, persons);
              if (child) {
                const childName = new IndividualName(child);
                markdown += `  - [${childName.getFullName()}](/${childName.formatUrlForMarkdown()})\n`;
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
          const father = findPersonByHandle(family.father_handle, persons);
          if (father) {
            const fatherName = new IndividualName(father);
            markdown += `  - **Father**: [${fatherName.getFullName()}](/${fatherName.formatUrlForMarkdown()})\n`;
          }
        }

        if (family.mother_handle) {
          const mother = findPersonByHandle(family.mother_handle, persons);
          if (mother) {
            const motherName = new IndividualName(mother);
            markdown += `  - **Mother**: [${motherName.getFullName()}](/${motherName.formatUrlForMarkdown()})\n`;
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
  persons: GedcomPerson.GedcomElement[],
  families: GedcomFamily.GedcomElement[]
): string {
  const personsWithLastName = persons.filter((person) => {
    const name = new IndividualName(person);
    return name.lastName === lastName;
  });

  // Find potential root persons (those without parents or with parents of different last names)
  const rootPersons = personsWithLastName.filter((person) => {
    if (person.parent_family_list.length === 0) {
      return true;
    }

    // Check if any parent has the same last name
    for (const familyHandle of person.parent_family_list) {
      const family = families.find((f) => f.handle === familyHandle);
      if (family) {
        const father = findPersonByHandle(family.father_handle ?? "", persons);
        const mother = findPersonByHandle(family.mother_handle ?? "", persons);

        if (father) {
          const fatherName = new IndividualName(father);
          if (fatherName.lastName === lastName) {
            return false;
          }
        }

        if (mother) {
          const motherName = new IndividualName(mother);
          if (motherName.lastName === lastName) {
            return false;
          }
        }
      }
    }

    return true;
  });

  let markdown = `# ${lastName} Family\n\n`;

  // Create nested list for each root person
  for (const rootPerson of rootPersons) {
    markdown += buildFamilyTreeMarkdown(rootPerson, persons, families, 0);
  }

  return markdown;
}

// Helper function to build nested family tree markdown
function buildFamilyTreeMarkdown(
  person: GedcomPerson.GedcomElement,
  persons: GedcomPerson.GedcomElement[],
  families: GedcomFamily.GedcomElement[],
  depth: number
): string {
  const name = new IndividualName(person);
  let markdown = `${"  ".repeat(depth)}- [${name.getFullName()}](/${name.formatUrlForMarkdown()})\n`;

  // Find children where this person is a parent
  const personFamilies = families.filter(
    (family) =>
      family.father_handle === person.handle ||
      family.mother_handle === person.handle
  );

  for (const family of personFamilies) {
    if (family.child_ref_list.length > 0) {
      for (const childRef of family.child_ref_list) {
        const child = findPersonByHandle(childRef.ref, persons);
        if (child) {
          const childName = new IndividualName(child);

          // Only include children with the same last name under the father
          if (person.gender === 1 && childName.lastName === name.lastName) {
            markdown += buildFamilyTreeMarkdown(
              child,
              persons,
              families,
              depth + 1
            );
          }
        }
      }
    }
  }

  return markdown;
}

// Main function to process the data
function doConversion(outputDir: string, staticContentDir: string) {
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
    lastNames.add(name.lastName);

    // Create directory for last name if it doesn't exist
    const lastNameDir = path.join(outputDir, name.lastName);
    ensureDirectoryExists(lastNameDir);

    // Create markdown file for person
    const markdownContent = createPersonMarkdown(
      person,
      persons,
      families,
      events
    );
    const outputFilePath = path.join(outputDir, name.getFilename());

    // Check if there's static content to append
    const staticContentPath = path.join(staticContentDir, name.getFilename());
    let finalContent = markdownContent;

    if (fs.existsSync(staticContentPath)) {
      const staticContent = fs.readFileSync(staticContentPath, "utf8");
      finalContent += "\n\n---\n\n" + staticContent;
    }

    // Write the markdown file
    fs.writeFileSync(outputFilePath, finalContent);
    console.log(`Created markdown file: ${outputFilePath}`);
  }

  // Create index files for each last name
  for (const lastName of lastNames) {
    // Create family tree markdown
    const familyTreeMarkdown = createFamilyTree(lastName, persons, families);
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
    console.log(`Created index file: ${indexFilePath}`);

    // Add to navigation items
    const familyNavItem: NavigationItem = {
      name: lastName,
      path: `/${lastName}`,
      children: [],
    };

    // Add person pages to navigation
    const personsWithLastName = persons.filter((person) => {
      const personName = new IndividualName(person);
      return personName.lastName === lastName;
    });

    for (const person of personsWithLastName) {
      const personName = new IndividualName(person);
      familyNavItem.children.push({
        name: personName.getFullName(),
        path: `/${personName.formatUrlForMarkdown()}`,
        children: [],
      });
    }

    returnPages.push(familyNavItem);
  }

  // Create routes directory and write navigation data
  const routesDir = path.join(process.cwd(), "dist", "routes");
  ensureDirectoryExists(routesDir);
  fs.writeFileSync(
    path.join(routesDir, "navigation.json"),
    JSON.stringify(returnPages, null, 2)
  );

  console.log("Processing complete!");
  return returnPages;
}

// Execute the conversion with command line arguments
const outputDir = process.argv[2] || "./output";
const staticContentDir = process.argv[3] || "./static";

doConversion(outputDir, staticContentDir);
