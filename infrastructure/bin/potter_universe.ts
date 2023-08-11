#!/usr/bin/env node

"use strict";
import 'source-map-support/register';
import * as fs from "fs";
import * as path from "path";
import * as gedcom from "gedcom";


const infile = "static/potter_universe.ged";
const outfile = "data/potter_universe.json";
const type = "json";

(async () => {
	const inputStr = fs.readFileSync(infile, "utf8");

	const parsed = gedcom.parse(inputStr);

	let output: string = "";

	output = JSON.stringify(parsed, null, 2);

	fs.writeFileSync(outfile, output, "utf8");

})();

