import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./node_modules/@greenwood/cli/src/loader.js", pathToFileURL("./"));

register("./litCssLoader.js", pathToFileURL("./lib/"));
