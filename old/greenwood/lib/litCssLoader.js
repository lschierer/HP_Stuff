import { readFile } from "fs/promises";

/**
 * @param {string} url
 * @param {{ format: string, importAttributes: { type?: 'module' | 'json' | 'css' } }} context
 * @param {Function} defaultLoad
 * @returns {Promise<{ format: string, source: string | ArrayBuffer | SharedArrayBuffer | Uint8Array }>}
 */
export async function load(url, context, defaultLoad) {
  const { importAttributes } = context;
  if (importAttributes.type === "css") {
    const content = await readFile(new URL(url)).then((res) => res.toString());
    return {
      format: "module",
      source: [
        //
        "import { css } from 'lit';",
        "export default css`",
        content,
        "`;",
      ].join("\n"),
    };
  }
  return defaultLoad(url, context, defaultLoad);
}
