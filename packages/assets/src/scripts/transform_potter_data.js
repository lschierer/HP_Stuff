"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doConversion = void 0;
var fs_1 = require("fs");
var path_1 = require("path");
// Import the filtered Potter Data
var import_potter_data_1 = require("./import_potter_data");
var IndividualName_1 = require("./IndividualName");
//Default page base within the relative to *both* src and dest directories for the content
var pageBase = "Harrypedia/people";
// Function to ensure directory exists
function ensureDirectoryExists(dirPath) {
  if (!fs_1.default.existsSync(dirPath)) {
    fs_1.default.mkdirSync(dirPath, { recursive: true });
  }
}
// Function to find a person by handle
function findPersonByHandle(handle) {
  return import_potter_data_1.persons.find(function (p) {
    return !p.handle.localeCompare(handle);
  });
}
// Function to create markdown content for a person
function createPersonMarkdown(person, persons, families, events) {
  var name = new IndividualName_1.IndividualName(person);
  var markdown = "# ".concat(name.getFullName(), "\n\n");
  // Add basic information
  markdown += "## Basic Information\n\n";
  markdown += "- **ID**: ".concat(person.gramps_id, "\n");
  markdown += "- **Gender**: ".concat(
    person.gender === 0 ? "Female" : person.gender === 1 ? "Male" : "Unknown",
    "\n\n"
  );
  // Add events (birth, death, etc.)
  if (person.event_ref_list.length > 0) {
    markdown += "## Events\n\n";
    person.event_ref_list.forEach(function (eventRef) {
      var event = events.find(function (e) {
        return e.handle === eventRef.ref;
      });
      if (event) {
        markdown += "- **".concat(event.type.string, "**: ");
        if (event.date && event.date.text) {
          markdown += event.date.text;
        }
        if (event.description) {
          markdown += " - ".concat(event.description);
        }
        markdown += "\n";
      }
    });
    markdown += "\n";
  }
  // Add family relationships
  if (person.family_list.length > 0) {
    markdown += "## Families\n\n";
    person.family_list.forEach(function (familyHandle) {
      var family = families.find(function (f) {
        return f.handle === familyHandle;
      });
      if (family) {
        // Determine if this person is father or mother in the family
        var isFather = family.father_handle === person.handle;
        var isMother = family.mother_handle === person.handle;
        if (isFather || isMother) {
          markdown += "### ".concat(family.type.string || "Family", "\n\n");
          // Add spouse information
          var spouseHandle = isFather
            ? family.mother_handle
            : family.father_handle;
          if (spouseHandle) {
            var spouse = findPersonByHandle(spouseHandle);
            if (spouse) {
              var spouseName = new IndividualName_1.IndividualName(spouse);
              markdown += "- **Spouse**: ["
                .concat(spouseName.getFullName(), "](/")
                .concat(spouseName.formatUrlForMarkdown(), ")\n");
            }
          }
          // Add children
          if (family.child_ref_list.length > 0) {
            markdown += "- **Children**:\n";
            family.child_ref_list.forEach(function (childRef) {
              var child = findPersonByHandle(childRef.ref);
              if (child) {
                var childName = new IndividualName_1.IndividualName(child);
                markdown += "  - ["
                  .concat(childName.getFullName(), "](/")
                  .concat(childName.formatUrlForMarkdown(), ")\n");
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
    markdown += "## Parents\n\n";
    person.parent_family_list.forEach(function (familyHandle) {
      var family = families.find(function (f) {
        return f.handle === familyHandle;
      });
      if (family) {
        markdown += "- **Family**: ".concat(
          family.type.string || "Family",
          "\n"
        );
        // Add father and mother information
        if (family.father_handle) {
          var father = findPersonByHandle(family.father_handle);
          if (father) {
            var fatherName = new IndividualName_1.IndividualName(father);
            markdown += "  - **Father**: ["
              .concat(fatherName.getFullName(), "](/")
              .concat(fatherName.formatUrlForMarkdown(), ")\n");
          }
        }
        if (family.mother_handle) {
          var mother = findPersonByHandle(family.mother_handle);
          if (mother) {
            var motherName = new IndividualName_1.IndividualName(mother);
            markdown += "  - **Mother**: ["
              .concat(motherName.getFullName(), "](/")
              .concat(motherName.formatUrlForMarkdown(), ")\n");
          }
        }
        markdown += "\n";
      }
    });
  }
  return markdown;
}
// Function to create family tree structure for a last name
function createFamilyTree(lastName, persons) {
  var personsWithLastName = persons.filter(function (person) {
    var name = new IndividualName_1.IndividualName(person);
    return name.lastName() === lastName;
  });
  // Find potential root persons (those without parents or with parents of different last names)
  var rootPersons = personsWithLastName.filter(function (person) {
    var _a;
    var _loop_1 = function (familyHandle) {
      var family = import_potter_data_1.families.find(function (f) {
        return f.handle === familyHandle;
      });
      if (family) {
        var father = findPersonByHandle(
          (_a = family.father_handle) !== null && _a !== void 0 ? _a : ""
        );
        if (father) {
          var fatherName = new IndividualName_1.IndividualName(father);
          if (fatherName.lastName() === lastName) {
            return { value: false };
          }
        }
      }
    };
    for (var _i = 0, _b = person.parent_family_list; _i < _b.length; _i++) {
      var familyHandle = _b[_i];
      var state_1 = _loop_1(familyHandle);
      if (typeof state_1 === "object") return state_1.value;
    }
    return true;
  });
  var markdown = "# ".concat(lastName, " Family\n\n");
  // Create nested list for each root person
  for (
    var _i = 0, rootPersons_1 = rootPersons;
    _i < rootPersons_1.length;
    _i++
  ) {
    var rootPerson = rootPersons_1[_i];
    markdown += buildFamilyTreeMarkdown(rootPerson, persons, 0);
  }
  return markdown;
}
// Helper function to build nested family tree markdown
function buildFamilyTreeMarkdown(person, persons, depth) {
  var _a;
  var name = new IndividualName_1.IndividualName(person);
  var markdown = ""
    .concat("  ".repeat(depth), "- [")
    .concat(name.getFullName(), "](")
    .concat(name.formatUrlForMarkdown("".concat(pageBase, "/")), ")\n");
  // Find children where this person is a parent
  var personFamilies = import_potter_data_1.families.filter(function (family) {
    return (
      family.father_handle === person.handle ||
      family.mother_handle === person.handle
    );
  });
  for (
    var _i = 0, personFamilies_1 = personFamilies;
    _i < personFamilies_1.length;
    _i++
  ) {
    var family = personFamilies_1[_i];
    if (family.child_ref_list.length > 0) {
      for (var _b = 0, _c = family.child_ref_list; _b < _c.length; _b++) {
        var childRef = _c[_b];
        var child = findPersonByHandle(childRef.ref);
        if (child) {
          var childName = new IndividualName_1.IndividualName(child);
          // Only include children with the same last name under the father if both exist
          if (childName.lastName() === name.lastName()) {
            var father = findPersonByHandle(
              (_a = family.father_handle) !== null && _a !== void 0 ? _a : ""
            );
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
var pagesCreated = function (pageRoots) {
  var fileList = new Array();
  for (var _i = 0, pageRoots_1 = pageRoots; _i < pageRoots_1.length; _i++) {
    var page = pageRoots_1[_i];
    fileList.push(page.fileName);
    if (page.children.length) {
      fileList.push.apply(fileList, pagesCreated(page.children));
    }
  }
  return fileList;
};
// Main function to process the data
var doConversion = function (outputDir, staticContentDir, pageBaseOveride) {
  if (pageBaseOveride !== undefined) {
    pageBase = pageBaseOveride;
  }
  // data is imported from ./import_potter_data
  console.log(
    "Found "
      .concat(import_potter_data_1.events.length, " Events, ")
      .concat(import_potter_data_1.families.length, " Families, and ")
      .concat(import_potter_data_1.persons.length, " Persons")
  );
  // Ensure output directory exists
  ensureDirectoryExists(outputDir);
  // Create navigation structure
  var returnPages = [];
  var lastNames = new Set();
  // Process each person
  for (
    var _i = 0, persons_1 = import_potter_data_1.persons;
    _i < persons_1.length;
    _i++
  ) {
    var person = persons_1[_i];
    var name_1 = new IndividualName_1.IndividualName(person);
    lastNames.add(name_1.lastName());
    // Create directory for last name if it doesn't exist
    var lastNameDir = path_1.default.join(outputDir, name_1.lastName());
    ensureDirectoryExists(lastNameDir);
    // Create markdown file for person
    var markdownContent = createPersonMarkdown(
      person,
      import_potter_data_1.persons,
      import_potter_data_1.families,
      import_potter_data_1.events
    );
    var outputFilePath = path_1.default.join(outputDir, name_1.getFilename());
    // Check if there's static content to append
    var staticContentPath = path_1.default.join(
      process.cwd(),
      staticContentDir,
      pageBase,
      name_1.getFilename()
    );
    var finalContent = markdownContent;
    if (fs_1.default.existsSync(staticContentPath)) {
      var staticContent = fs_1.default.readFileSync(staticContentPath, "utf8");
      finalContent += "\n\n---\n\n" + staticContent;
    }
    // Write the markdown file
    fs_1.default.writeFileSync(outputFilePath, finalContent);
  }
  var _loop_2 = function (lastName) {
    // Create family tree markdown
    var familyTreeMarkdown = createFamilyTree(
      lastName,
      import_potter_data_1.persons
    );
    var indexFilePath = path_1.default.join(outputDir, lastName, "index.md");
    // Check if there's static content to append
    var staticIndexPath = path_1.default.join(
      process.cwd(),
      staticContentDir,
      pageBase,
      lastName,
      "index.md"
    );
    var finalContent = familyTreeMarkdown;
    if (fs_1.default.existsSync(staticIndexPath)) {
      var staticContent = fs_1.default.readFileSync(staticIndexPath, "utf8");
      finalContent += "\n\n---\n\n" + staticContent;
    }
    // Write the index file
    fs_1.default.writeFileSync(indexFilePath, finalContent);
    // Add to navigation items
    var familyNavItem = {
      title: "".concat(lastName, " Family"),
      fileName: indexFilePath,
      route: "/".concat(pageBase, "/").concat(lastName, "/"),
      children: [],
    };
    // Add person pages to navigation
    var personsWithLastName = import_potter_data_1.persons.filter(
      function (person) {
        var personName = new IndividualName_1.IndividualName(person);
        return personName.lastName() === lastName;
      }
    );
    for (
      var _b = 0, personsWithLastName_1 = personsWithLastName;
      _b < personsWithLastName_1.length;
      _b++
    ) {
      var person = personsWithLastName_1[_b];
      var personName = new IndividualName_1.IndividualName(person);
      var personFileName = path_1.default.join(
        outputDir,
        personName.getFilename()
      );
      familyNavItem.children.push({
        title: personName.getFullName(),
        fileName: personFileName,
        route: personName.formatUrlForMarkdown("".concat(pageBase, "/")),
        children: [],
      });
    }
    returnPages.push(familyNavItem);
  };
  // Create index files for each last name
  for (var _a = 0, lastNames_1 = lastNames; _a < lastNames_1.length; _a++) {
    var lastName = lastNames_1[_a];
    _loop_2(lastName);
  }
  // Create routes directory and write navigation data
  var routesDir = path_1.default.join(
    process.cwd(),
    "dist",
    "routes",
    pageBase
  );
  ensureDirectoryExists(routesDir);
  fs_1.default.writeFileSync(
    path_1.default.join(routesDir, "index.json"),
    JSON.stringify(returnPages, null, 2)
  );
  console.log("Transform Potter Universe Gedcom Data Complete!");
  return pagesCreated(returnPages);
};
exports.doConversion = doConversion;
// Execute the conversion with command line arguments
var outputDir = process.argv[2] || "./output";
var staticContentDir = process.argv[3] || "./";
(0, exports.doConversion)(outputDir, staticContentDir);
