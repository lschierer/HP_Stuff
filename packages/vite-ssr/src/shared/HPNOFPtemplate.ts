import debugFunction from "../shared/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`debugging enabled for ${new URL(import.meta.url).pathname}`);
}

const getBody = async () => {
  /*start work around for GetFrontmatter requiring async */
  await new Promise((resolve) => setTimeout(resolve, 1));
  /* end workaround */

  return `
    BODY
  `;
};

export { getBody };
