import { build } from "esbuild";
import { glob } from "glob";
import { resolve } from "node:path";
import { mkdirSync } from "node:fs";

const entries = await glob("src/client/**/*.ts");
console.log("Matched client entries:", entries);

import { dirname } from "path";

await Promise.all(
  entries.map(async (entry) => {
    const relPath = entry.replace("src/client/", "");
    const outFile = resolve("dist/client", relPath.replace(/\.ts$/, ".js"));

    mkdirSync(dirname(outFile), { recursive: true });

    await build({
      entryPoints: [entry],
      outfile: outFile,
      bundle: true,
      platform: "browser",
      format: "esm",
      sourcemap: true,
    });
  })
);

console.log("✅ Client build complete");
