import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeLinkProcessor from "rehype-link-processor";
import { unified } from "unified";

import fs from "node:fs/promises";
import path from "node:path";

import { Bookmark } from "../schemas/bookmarks.ts";
import { z } from "zod";

import debugFunction from "./debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

export default class BookmarksList {
  accessor category = "";
  private _bookmarks = new Array<Bookmark>();

  get bookmarks() {
    return this._bookmarks;
  }

  readonly listBookMarks = () => {
    return this._bookmarks
      .map((b) => {
        return `
        <dt class="spectrum-Heading spectrum-Heading--sizeM">
          ${
            b.title.link
              ? `<a
                  href="${b.title.link}"
                  class=" spectrum-Link spectrum-Link--quiet spectrum-Link--primary "
                  ><cite >${b.title.name}</cite></a>`
              : `<span><cite>${b.title.name}</cite></span>`
          }
        </dt>
        <dd>
          <span class=" spectrum-Detail spectrum-Detail--sizeM spectrum-Detail-strong ">Author: </span>
          ${
            b.author.link
              ? `<a
                  href="${b.author.link}"
                  class=" spectrum-Link spectrum-Link--quiet spectrum-Link--primary "
                  >${b.author.name}</a>`
              : `<span class=" spectrum-Body spectrum-Body--sizeM ">${b.author.name}</span>`
          }

        </dd>
        <dd>
          <span class="spectrum-Detail spectrum-Detail--sizeM spectrum-Detail-strong ">Date(s): </span><br/>
            <ul class="dateList">
            ${
              b.dates.published
                ? `
                  <li class="spectrum-Detail spectrum-Detail--sizeM">
                    <span class="spectrum-Detail-strong ">Published:</span>
                    <span class="spectrum-Detail--light">${b.dates.published}</span>
                  </li>
                `
                : ``
            }
            ${
              b.dates.updated
                ? `
                  <li class="spectrum-Detail spectrum-Detail--sizeM">
                    <span class="spectrum-Detail-strong ">Updated:</span>
                    <span class="spectrum-Detail--light">${b.dates.updated}</span>
                  </li>
                `
                : ""
            }
            ${
              b.dates.completed
                ? `
                  <li class="spectrum-Detail spectrum-Detail--sizeM">
                    <span class="spectrum-Detail-strong ">Completed:</span>
                    <span class="spectrum-Detail--light">${b.dates.completed}</span>
                  </li>
                `
                : b.dates.completed == undefined
                  ? ""
                  : `<span class="spectrum-Detail spectrum-Detail--sizeM  spectrum-Detail-strong spectrum-Detail-emphasized ">Incomplete.</span>`
            }
            </ul>
        </dd>
        <dd>
          <span class=" spectrum-Detail spectrum-Detail--sizeM spectrum-Detail-strong">Comments: </span>${unified()
            .use(remarkParse)
            .use(remarkGfm)
            .use(remarkRehype)
            .use(
              rehypeLinkProcessor({
                rules: [
                  () => {
                    return {
                      className:
                        "spectrum-Link spectrum-Link--quiet spectrum-Link--primary",
                    };
                  },
                ],
              })
            )
            .use(rehypeStringify)
            .processSync(b.comments)
            .toString()}
        </dd>
      `;
      })
      .join("\n");
  };

  private computeBasePath = (depth: number) => {
    let bp = "";
    if (depth < 0) {
      throw new Error(`depth must be a positive integer, not ${depth}`);
      return "./";
    }
    if (depth == 1) {
      bp = "./";
      return bp;
    } else {
      while (depth) {
        bp = bp.concat("../");
        depth--;
      }
    }
    return bp;
  };

  readonly ParseBookmarks = async () => {
    const basePath =
      process.env.__GWD_COMMAND__ == "serve" ? this.computeBasePath(1) : "../";
    const filePath = new URL(
      path.join(basePath, `/assets/Bookmarks/${this.category}.json`),
      import.meta.url
    );
    const bookmarkData = await fs
      .readFile(filePath, {
        encoding: "utf-8",
      })
      .catch((error: unknown) => {
        console.error(
          `failed to load file for ${this.category}`,
          `error is ${JSON.stringify(error)}`
        );
      });
    if (bookmarkData) {
      if (DEBUG) {
        console.log(
          `ParseBookmarks read in data from file for '${this.category}`
        );
      }
      const valid = z.array(Bookmark).safeParse(JSON.parse(bookmarkData));
      if (valid.success) {
        valid.data.map((b) => {
          this._bookmarks.push(b);
        });
      } else {
        if (DEBUG) {
          console.log(
            `failed to parse bookmark data`,
            `error is \n`,
            valid.error.message
          );
        }
      }
    } else {
      if (DEBUG) {
        console.log(`no data available for '${this.category}`);
      }
    }
  };
}
