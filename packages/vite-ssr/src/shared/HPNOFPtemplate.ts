import { setTimeout } from "node:timers/promises";
import pTimeout from "p-timeout";

import debugFunction from "../shared/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`debugging enabled for ${new URL(import.meta.url).pathname}`);
}

const getBody = async () => {
  /*start work around for GetFrontmatter requiring async */
  const delayedPromise = setTimeout(1);
  await pTimeout(delayedPromise, {
    milliseconds: 1,
  });
  /* end workaround */

  return `
    BODY
  `;
};

export { getBody };
