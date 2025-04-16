import { Hono } from "hono";

import * as path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";
import { isDirectorySync } from "./SSRUtils";

import { ParsedResult } from "@schemas/page";
import { defaultLayout } from "./layout";
import { mdTohtml } from "./mdTohtml";

import debugFunction from "@shared/debug";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);

if (DEBUG) {
  console.log("🔍 FanFiction module is being loaded");
}

const app = new Hono();

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

app.get("/*", async (c) => {
  if (DEBUG) {
    console.log("📖 FanFiction route handler called:", c.req.path);
  }

  const reqPath = c.req.path;
  const reqDir = path.dirname(reqPath);
  const reqFile = path.basename(reqPath, ".html");

  const fragmentPath = path.join(
    fileURLToPath(import.meta.url),
    "../../Pages/",
    reqDir,
    `${reqFile}.fragment.html`
  );

  let result: null | string | ParsedResult = null;
  if (fs.existsSync(fragmentPath)) {
    if (DEBUG) {
      console.log(`found ${fragmentPath}`);
    }
    const data = fs.readFileSync(fragmentPath, "utf-8");
    result = await defaultLayout({
      title: "",
      route: reqDir,
      content: data,
    });
  } else {
    if (DEBUG) {
      console.log(`${fragmentPath} not found`);
    }
    result = await mdTohtml(reqPath);
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
  if (DEBUG) console.log(`404 fallback: ${c.req.path}`);
  return c.text("Not found", 404);
});

export default app;
