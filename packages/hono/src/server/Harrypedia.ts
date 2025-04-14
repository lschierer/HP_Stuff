import { Hono } from "hono";

import * as path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";
import { isDirectorySync } from "./SSRUtils";

import { ParsedResult } from "@schemas/page";
import { defaultLayout } from "./layout";
import { mdTohtml } from "./mdTohtml";

import debugFunction from "@shared/debug";

import History from "./History";

const DEBUG = debugFunction(new URL(import.meta.url).pathname);

console.log(`🔍 Harrypedia module is being loaded with DEBUG ${DEBUG}`);

const app = new Hono({ strict: false });

app.get("/", async (c) => {
  if (DEBUG) {
    console.log(`matched the root route for the Harrypedia Module`);
  }
  const reqPath = c.req.path;

  const PagesBase = path.join(fileURLToPath(import.meta.url), "../../Pages/");
  if (DEBUG) {
    console.log(`serving dir ${reqPath} of ${PagesBase}`);
  }
  let result: ParsedResult | string | null = null;
  if (isDirectorySync(path.join(PagesBase, reqPath))) {
    if (fs.existsSync(path.join(PagesBase, reqPath, `index.html`))) {
      const data = fs.readFileSync(
        path.join(PagesBase, reqPath, `index.html`),
        "utf-8"
      );
      result = await defaultLayout({
        title: "",
        route: reqPath,
        content: data,
      });
    }
    if (fs.existsSync(path.join(PagesBase, reqPath, `index.md`))) {
      if (DEBUG) {
        console.log(
          `found index.md for ${path.join(PagesBase, reqPath, `index.md`)}`
        );
      }
      result = await mdTohtml(`${reqPath}/index`);
      if (DEBUG) {
        console.log(
          `mdTohtml returned ${typeof result === "string" ? `"${result}"` : typeof result}`
        );
      }
    } else {
      if (DEBUG) {
        console.log(
          `no index.md found at ${path.join(PagesBase, reqPath, `index.md`)}`
        );
      }
    }
  }
  if (!result) {
    return c.notFound();
  }

  if (typeof result === "string") {
    return c.html(result);
  } else if (ParsedResult.safeParse(result).success) {
    return c.html(result.html);
  } else {
    if (DEBUG) {
      console.error(`unknown result type for ${reqPath}`);
    }
    return c.notFound();
  }
});

app.route("/History", History);

app.get("/*", async (c) => {
  if (DEBUG) {
    console.log("📖 Harrypedia route handler called:", c.req.path);
  }

  const reqPath = c.req.path;
  const reqDir = path.dirname(reqPath);
  const baseName = path.basename(reqPath, ".html");
  const PagesBase = path.join(fileURLToPath(import.meta.url), "../../Pages/");
  if (DEBUG) {
    console.log(`derived reqFile ${baseName} in dir ${reqDir} of ${PagesBase}`);
  }
  let result: ParsedResult | string | null = null;
  if (fs.existsSync(path.join(PagesBase, `${reqPath}.html`))) {
    if (DEBUG) {
      console.log(
        `found ${reqPath} as html at ${path.join(PagesBase, `${reqPath}.html`)}`
      );
    }
    const data = fs.readFileSync(
      path.join(PagesBase, `${reqPath}.html`),
      "utf-8"
    );
    result = await defaultLayout({
      title: "",
      route: reqPath,
      content: data,
    });
  } else if (fs.existsSync(path.join(PagesBase, `${reqPath}.md`))) {
    if (DEBUG) {
      console.log(
        `found ${reqPath} as md at ${path.join(PagesBase, `${reqPath}.md`)}`
      );
    }
    result = await mdTohtml(reqPath);
  } else if (isDirectorySync(path.join(PagesBase, reqPath))) {
    if (fs.existsSync(path.join(PagesBase, reqPath, `index.html`))) {
      if (DEBUG) {
        console.log(
          `found ${reqPath} as html at ${path.join(PagesBase, reqPath, `index.html`)}`
        );
      }
      const data = fs.readFileSync(
        path.join(PagesBase, reqPath, `index.html`),
        "utf-8"
      );
      result = await defaultLayout({
        title: "",
        route: reqPath,
        content: data,
      });
    } else if (fs.existsSync(path.join(PagesBase, reqPath, `index.md`))) {
      if (DEBUG) {
        console.log(
          `found ${reqPath} as md at ${path.join(PagesBase, reqPath, `index.md`)}`
        );
      }
      result = await mdTohtml(path.join(reqPath, `index`));
    }
  } else {
    if (DEBUG) {
      console.log(
        `${reqPath} not found as a file inside ${PagesBase}. tested:\n`,
        path.join(PagesBase, `${reqPath}.html`),
        "\n",
        path.join(PagesBase, `${reqPath}.md`),
        "\n",
        path.join(PagesBase, reqPath, `index.md`),
        "\n",
        path.join(PagesBase, reqPath, `index.md`),
        "\n"
      );
    }
  }
  if (!result) {
    return c.notFound();
  }

  if (typeof result === "string") {
    return c.html(result);
  } else if (ParsedResult.safeParse(result).success) {
    return c.html(result.html);
  } else {
    if (DEBUG) {
      console.error(`unknown result type for ${reqPath}`);
    }
    return c.notFound();
  }
});

app.notFound((c) => {
  console.log(`404 fallback: ${c.req.path}`);
  return c.text("Not found", 404);
});

export default app;
