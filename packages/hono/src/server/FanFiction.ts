import { Hono } from "hono";

import * as path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";

import { defaultLayout, ParsedResult } from "./layout";
import { mdTohtml } from "./mdTohtml";

import debugFunction from "@shared/debug";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);

if (DEBUG) {
  console.log("🔍 FanFiction module is being loaded");
}

const FanFiction = new Hono();
FanFiction.get("/*", async (c) => {
  if (DEBUG) {
    console.log("📖 FanFiction route handler called:", c.req.path);
  }

  const reqPath = c.req.path;
  const reqDir = path.dirname(reqPath);
  const reqFile = path.basename(reqPath, ".html");

  const fragmentPath = path.join(
    fileURLToPath(import.meta.url),
    "../../pages/",
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

FanFiction.notFound((c) => {
  if (DEBUG) console.log(`404 fallback: ${c.req.path}`);
  return c.text("Not found", 404);
});

export default FanFiction;
