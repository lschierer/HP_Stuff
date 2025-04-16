import * as fs from "node:fs";
import * as path from "node:path";
import yaml from "js-yaml";
import { z } from "zod";

import debugFunction from "@shared/debug";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
console.log(
  `DEBUG is set to ${DEBUG} for ${new URL(import.meta.url).pathname}`
);

import { persons, families, events } from "./import_potter_data";
import IndividualName from "@shared/gedcom/IndividualName";

import { type NavigationItem } from "@hp-stuff/schemas";
import { GedcomFamily, GedcomPerson } from "@hp-stuff/schemas/gedcom";

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

const outputDir = path.join(process.cwd(), "dist/Harrypedia/people");
const staticContent = path.join(process.cwd(), "people");

const doConversion = async () => {
  const returnPages = new Array<NavigationItem>();

  if (!(persons.length > 0)) {
    if (DEBUG) {
      console.log(
        `failed to set GrampsState for provider anon in GedcomPeopleSourcePlugin`
      );
    }
    throw new Error(`failed to populate persons`);
  } else {
    if (DEBUG) {
      console.log(`events has ${events.length} events`);
      console.log(`families has ${families.length} families`);
      console.log(`persons has ${persons.length} people`);
      console.log(`staticContent is ${staticContent}`);
      console.log(`outputDir is ${outputDir}`);
    }

    /*
      I need to do several things:

      1. For each person in persons I need to create a markdown page in outputDir
         1.1 This markdown page will go in `${outputDir}/${lastname}/${firstname} ${suffix}.md`
         1.2 The directory `${outputDir}/${lastname}` may not exist yet. the script may need to create it.
         1.3 If ${lastname} == 'Unknown' then the filename is `${outputDir}/Unknown/${firstname} - ${gramps_id}.md`
         1.4 If ${firstname} == 'Unknown' then the filename is `${outputDir}/${lastname}/${gramps_id}.md`
         1.5 if both ${lastname} and ${firstname} == 'Unknown' then the filename is  `${outputDir}/Unknown/${gramps_id}.md`
         1.6 Links in the generated markdown should be formatted using the formatUrlForMarkdown in this file
         1.7 if there is a file in ${staticContent} that corresponds to the final value of the output filename (with ${staticContent} substituted for ${outputDir}) then that should be appended to the output file under a markdown hr
      2. As each person is processed in #1 above, I need to keep track of the last names.
         2.1 For each last name, I need to create a nested list of members
         2.2 The list should reflect parent/child relationships.  the parent_family_list in the person itself tells you which family in families contains the parents of a given person.  In that family there is a father_handle and mother_handle attribute that corresponds to the handle attribute in a person in persons.
         2.3 If both mother and father have the same computed last name, the child should be nested under the father.
         2.4 an index.md page for each `${outputDir/${lastname}` should be created containing the resulting nested list.
         2.5 is a corresponding index.md page exists at ${staticContent}/${lastName} this should be appended to the generated one at ${outputDir}/${lastName}
      3. a file in ${process.cwd()}/dist/routes/ (the directory may need to be created) should be populated with the JSON.stringify() of returnPages from this function  this variable should be maintained in a hierarchical manner using the NavigationItem object's children array as pages are created.
      4. the IndividualName class should be used to obtain names and the text of link targets to provide uniformity
    */
  }
};

await doConversion();
