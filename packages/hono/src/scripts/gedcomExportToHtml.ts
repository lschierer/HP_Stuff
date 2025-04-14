import * as fs from "node:fs";
import * as path from "node:path";
import yaml from "js-yaml";
import { z } from "zod";

import debugFunction from "@shared/debug";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);

import { type NavigationItem } from "@schemas/page";
import { GrampsState, getGrampsData } from "@shared/gedcom/state";
import IndividualName from "@shared/gedcom/IndividualName";
import { GedcomFamily, GedcomPerson } from "@schemas/gedcom";

const staticPersonFiles = path.join(process.cwd(), "../../assets/people");

// Define the PersonWithRelationships schema by extending GedcomPerson.GedcomElement
const PersonWithRelationshipsSchema = GedcomPerson.GedcomElement.partial({
  _class: true,
  change: true,
  private: true,
  tag_list: true,
  citation_list: true,
  note_list: true,
  media_list: true,
  attribute_list: true,
  address_list: true,
  urls: true,
  lds_ord_list: true,
  primary_name: true,
  event_ref_list: true,
  alternate_names: true,
  person_ref_list: true,
  death_ref_index: true,
  birth_ref_index: true,
  gender: true,
}).extend({
  name: z.string(),
  routePath: z.string(),
  addedToParent: z.boolean(),
});
type PersonWithRelationshipsSchema = z.infer<
  typeof PersonWithRelationshipsSchema
>;

// Create the TypeScript type from the Zod schema
type PersonWithRelationships = z.infer<typeof PersonWithRelationshipsSchema> & {
  children: PersonWithRelationshipsSchema[];
};
const PersonWithRelationships: z.ZodType<PersonWithRelationships> =
  PersonWithRelationshipsSchema.extend({
    children: z.lazy(() => PersonWithRelationships.array()),
  });

// Interface to track people by last name for index pages
interface LastNameIndex {
  [lastName: string]: {
    people: Record<string, PersonWithRelationships>; // Keyed by handle for easy lookup
    rootPeople: PersonWithRelationships[]; // People without parents in the same surname group
  };
}

/**
 * Format a URL path for use in Markdown links
 * If the path contains spaces, enclose it in angle brackets
 */
const formatUrlForMarkdown = (url: string): string => {
  return url.includes(" ") ? `<${url}>` : url;
};

const doConversion = async () => {
  const returnPages = new Array<NavigationItem>();
  const lastNameIndices: LastNameIndex = {};
  const families: Record<string, GedcomFamily.GedcomElement> = {};

  await getGrampsData();
  if (!GrampsState.people.size) {
    if (DEBUG) {
      console.log(
        `failed to set GrampsState for provider anon in GedcomPeopleSourcePlugin`
      );
    }
    throw new Error(`failed to populate GrampsState.people`);
  } else {
    if (DEBUG) {
      console.log(`GrampsState has ${GrampsState.people.size} people`);
    }

    // Load families data
    try {
      const familiesPath = path.join(
        process.cwd(),
        "src/assets/gedcom/families.json"
      );
      const familiesData = JSON.parse(
        fs.readFileSync(familiesPath, "utf-8")
      ) as object[];

      if (DEBUG) {
        console.log(`Loaded ${familiesData.length} families`);
      }

      // Index families by handle for easy lookup
      familiesData.forEach((fo) => {
        const valid = GedcomFamily.GedcomElement.safeParse(fo);
        if (valid.success) {
          families[valid.data.handle] = valid.data;
        }
      });
    } catch (err) {
      if (DEBUG) {
        console.error(`Error loading families data: ${JSON.stringify(err)}`);
      }
    }

    // First pass: Process all individuals and collect last name data with family relationships
    for (const [key, person] of GrampsState.people) {
      if (DEBUG) {
        console.log(`building route for ${key}`);
      }

      const pId = person.id;
      const individualName = new IndividualName(pId);
      const routePath = individualName.buildLinkTarget();
      const lastName = individualName.lastName() || "Unknown";

      // Add person to the appropriate last name index
      if (!Object.keys(lastNameIndices).includes(lastName)) {
        lastNameIndices[lastName] = {
          people: {},
          rootPeople: [],
        };
      }

      // Create person with relationships
      const personWithRelationships: PersonWithRelationships = {
        id: pId,
        handle: person.handle,
        name: individualName.displayName(),
        routePath: routePath,
        parent_family_list: person.parent_family_list,
        family_list: person.family_list,
        children: [],
        addedToParent: false,
      };

      // Add to people lookup
      lastNameIndices[lastName].people[person.handle] = personWithRelationships;

      // Generate individual person page
      const staticPath = path.join(
        staticPersonFiles,
        path.dirname(routePath.replace("/Harrypedia/people", "")),
        `${path.basename(routePath)}.md`
      );
      if (DEBUG) {
        console.log(`staticPath is '${staticPath}' for ${routePath}`);
      }
      let pageContent = "";
      pageContent += "---\n";
      pageContent += `title: ${individualName.displayName()}\n`;
      pageContent += `collection: \n  - Harrypedia\n  - gedcom\n  - ${lastName}\n`;
      pageContent += `${yaml.dump({ gedcom: person }).trim()}\n`;
      pageContent += "---\n";
      if (fs.existsSync(staticPath)) {
        try {
          pageContent += fs.readFileSync(staticPath, "utf-8");
        } catch (err) {
          if (DEBUG) {
            console.error(
              `error reading file for ${staticPath}: ${JSON.stringify(err)}`
            );
          }
        }
      }
      const outputDir = path.join(
        process.cwd(),
        "src/Pages/",
        path.dirname(routePath)
      );
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, {
          recursive: true,
          mode: 0o750,
        });
      }
      const fullOutput = path.join(outputDir, `${path.basename(routePath)}.md`);
      fs.writeFileSync(fullOutput, pageContent, {
        mode: 0o640,
        encoding: "utf-8",
        flag: "w",
      });
      const ni: NavigationItem = {
        title: individualName.displayName(),
        route: routePath,
        html: pageContent,
        children: [],
      };
      returnPages.push(ni);
    }

    // Second pass: Build family relationships within each last name group
    for (const [lastName, data] of Object.entries(lastNameIndices)) {
      if (DEBUG) {
        console.log(`second pass processing ${lastName}`);
      }
      // Process parent-child relationships
      for (const personHandle in data.people) {
        const person = data.people[personHandle];

        // Check if this person has any parent families in the same surname group
        let hasParentInSameGroup = false;

        // For each family where this person is a child
        for (const familyHandle of person.parent_family_list) {
          const family = families[familyHandle];

          // First check if father is in the same surname group
          // We prefer adding children to fathers over mothers when both are present
          if (
            family.father_handle &&
            Object.keys(data.people).includes(family.father_handle)
          ) {
            const father = data.people[family.father_handle];
            if (
              !father.children.some((child) => child.handle === person.handle)
            ) {
              father.children.push(person);
              person.addedToParent = true;
              hasParentInSameGroup = true;
            }
          }
          // Only add to mother if not already added to father and mother is in the same surname group
          else if (
            family.mother_handle &&
            Object.keys(data.people).includes(family.mother_handle) &&
            !person.addedToParent
          ) {
            const mother = data.people[family.mother_handle];
            if (
              !mother.children.some((child) => child.handle === person.handle)
            ) {
              mother.children.push(person);
              person.addedToParent = true;
              hasParentInSameGroup = true;
            }
          }
        }

        // If no parent in the same surname group, this is a root person
        if (!hasParentInSameGroup) {
          data.rootPeople.push(person);
        }
      }

      // Sort root people alphabetically
      data.rootPeople.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Third pass: Generate index pages for each last name with hierarchical structure
    for (const [lastName, data] of Object.entries(lastNameIndices)) {
      if (DEBUG) {
        console.log(`Generating index page for last name: ${lastName}`);
      }

      // Create the index page content
      let indexContent = "";
      indexContent += "---\n";
      indexContent += `title: ${lastName} Family\n`;
      indexContent += `collection: \n  - Harrypedia\n  - gedcom\n  - ${lastName}\n`;
      indexContent += "---\n\n";
      indexContent += `# ${lastName} Family Members\n\n`;
      indexContent +=
        "This page lists all individuals with the last name " +
        `${lastName} in the genealogical database, organized by family relationships.\n\n`;

      // Function to recursively render a person and their descendants
      const renderPersonWithDescendants = (
        person: PersonWithRelationships,
        depth: number,
        renderedHandles: Set<string> = new Set()
      ): string => {
        // Avoid infinite recursion by tracking rendered handles
        if (renderedHandles.has(person.handle)) {
          return "";
        }
        renderedHandles.add(person.handle);

        // Format the URL properly for Markdown
        const formattedUrl = formatUrlForMarkdown(person.routePath);
        let content = `${"  ".repeat(depth)}- [${person.name}](${formattedUrl})\n`;

        // Sort children alphabetically
        const sortedChildren = new Array<PersonWithRelationships>();
        person.children
          .sort((a, b) => a.name.localeCompare(b.name))
          .forEach((c) => {
            const valid = PersonWithRelationships.safeParse(c);
            if (valid.success) {
              sortedChildren.push(valid.data);
            } else {
              if (DEBUG) {
                console.error(valid.error.message);
              }
            }
          });

        // Add children
        for (const child of sortedChildren) {
          content += renderPersonWithDescendants(
            child,
            depth + 1,
            renderedHandles
          );
        }

        return content;
      };

      // Render all root people and their descendants
      for (const rootPerson of data.rootPeople) {
        indexContent += renderPersonWithDescendants(rootPerson, 0, new Set());
      }

      // Check if there are any people who weren't included in the hierarchy
      // (This can happen if the family relationships are incomplete)
      const renderedHandles = new Set<string>();
      for (const rootPerson of data.rootPeople) {
        const collectHandles = (person: PersonWithRelationships) => {
          renderedHandles.add(person.handle);
          for (const data of person.children) {
            const valid = PersonWithRelationships.safeParse(data);
            if (valid.success) {
              collectHandles(valid.data);
            } else {
              console.error(valid.error.message);
            }
          }
        };
        collectHandles(rootPerson);
      }

      // Add any people who weren't included in the hierarchy
      const unrenderedPeople = Object.values(data.people).filter(
        (person) => !renderedHandles.has(person.handle)
      );

      if (unrenderedPeople.length > 0) {
        indexContent += "\n## Other Family Members\n\n";
        indexContent +=
          "These individuals couldn't be connected to the main family tree:\n\n";

        // Sort alphabetically
        unrenderedPeople.sort((a, b) => a.name.localeCompare(b.name));

        for (const person of unrenderedPeople) {
          // Format the URL properly for Markdown
          const formattedUrl = formatUrlForMarkdown(person.routePath);
          indexContent += `- [${person.name}](${formattedUrl})\n`;
        }
      }

      // Check if there's an existing index file in the assets directory
      const staticIndexPath = path.join(
        staticPersonFiles,
        lastName,
        "index.md"
      );
      if (fs.existsSync(staticIndexPath)) {
        try {
          const staticContent = fs.readFileSync(staticIndexPath, "utf-8");
          if (staticContent.trim().length > 0) {
            indexContent += "\n\n---\n\n";
            indexContent += staticContent;
            if (DEBUG) {
              console.log(`Appended content from ${staticIndexPath}`);
            }
          }
        } catch (err) {
          if (DEBUG) {
            console.error(
              `Error reading static index file for ${lastName}: ${JSON.stringify(err)}`
            );
          }
        }
      }

      // Create the index page route
      const indexRoutePath = `/Harrypedia/people/${lastName}/index`;
      const outputDir = path.join(
        process.cwd(),
        "src/Pages/Harrypedia/people",
        lastName
      );

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, {
          recursive: true,
          mode: 0o750,
        });
      }

      const fullOutput = path.join(outputDir, "index.md");
      fs.writeFileSync(fullOutput, indexContent, {
        mode: 0o640,
        encoding: "utf-8",
        flag: "w",
      });

      // Add the index page to the navigation items
      const ni: NavigationItem = {
        title: `${lastName} Family`,
        route: indexRoutePath,
        html: indexContent,
        children: [],
      };
      returnPages.push(ni);
    }
  }

  const routedir = path.join(process.cwd(), "src/shared/routes");
  if (!fs.existsSync(routedir)) {
    fs.mkdirSync(routedir, {
      recursive: true,
      mode: 0o750,
    });
  }
  const routeFile = path.join(routedir, "gedcomroutes.json");
  fs.writeFileSync(routeFile, JSON.stringify(returnPages, null, 2));
};

await doConversion();
