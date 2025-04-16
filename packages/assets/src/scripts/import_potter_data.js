"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.persons = exports.families = exports.events = void 0;
var fs = require("node:fs");
var path = require("node:path");
var gedcom_1 = require("@hp-stuff/schemas/gedcom");
var potterRawExport = path.join(process.cwd(), "potter_universe.json");
console.log("potterRawExport is ".concat(potterRawExport));
var inputFile = fs.readFileSync(potterRawExport, "utf8");
var lines = inputFile.trim().split("\n");
var jsonObjects = lines.map(function (line) {
  return JSON.parse(line);
});
// Filter and type the data
var rawEvents = jsonObjects.filter(function (item) {
  return item["_class"] === "Event";
});
var rawFamilies = jsonObjects.filter(function (item) {
  return item["_class"] === "Family";
});
var rawPersons = jsonObjects.filter(function (item) {
  return item["_class"] === "Person";
});
// Validate data against schemas (this will throw if validation fails)
// Note: You may need to adjust this based on your actual schema structure
var events = rawEvents.map(function (event) {
  return gedcom_1.GedcomEvent.GedcomElement.parse(event);
});
exports.events = events;
var families = rawFamilies.map(function (family) {
  return gedcom_1.GedcomFamily.GedcomElement.parse(family);
});
exports.families = families;
var persons = rawPersons.map(function (person) {
  return gedcom_1.GedcomPerson.GedcomElement.parse(person);
});
exports.persons = persons;
console.log(
  "Loaded "
    .concat(events.length, " events, ")
    .concat(families.length, " families, and ")
    .concat(persons.length, " persons.")
);
