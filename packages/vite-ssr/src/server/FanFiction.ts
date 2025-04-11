import { Hono } from "hono";

import * as path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";

import { defaultLayout } from "./layout";

import debugFunction from "@shared/debug";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);

if (DEBUG) {
  console.log("🔍 FanFiction module is being loaded");
}

const FanFiction = new Hono();
FanFiction.get("/*", (c) => {
  if (DEBUG) {
    console.log("📖 FanFiction route handler called:", c.req.path);
  }

  const reqPath = c.req.path;
  const reqDir = path.dirname(reqPath);
  const reqFile = path.basename(reqPath, ".html");

  const realPath = path.join(
    fileURLToPath(import.meta.url),
    "../../pages/",
    reqDir,
    `${reqFile}.fragment.html`
  );

  if (fs.existsSync(realPath)) {
    if (DEBUG) {
      console.log(`found ${realPath}`);
    }
    const data = fs.readFileSync(realPath, "utf-8");
    const html = defaultLayout({
      title: "",
      content: data,
    });
    return c.html(html);
  } else {
    if (DEBUG) {
      console.log(`${realPath} not found`);
    }
  }
  return c.html("<span>Success</span>");
});

export default FanFiction;
