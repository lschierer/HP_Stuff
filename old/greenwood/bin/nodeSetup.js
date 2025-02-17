import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./node_modules/@greenwood/cli/src/loader.js", pathToFileURL("./"));

const application = await import("@greenwood/cli/src/index.js");

/*
 * process.argv is the array
 * [0] points to node
 * [1] points to the script
 * [2] is the first true parameter/argument
 */
