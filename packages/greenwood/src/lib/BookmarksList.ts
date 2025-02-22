import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { DateTime } from "luxon";

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
        <dt>
          ${
            b.title.link
              ? `<a href="${b.title.link}">${b.title.name}</a>`
              : `<span>${b.title.name}</span>`
          }
        </dt>
        <dd>
          Author: ${
            b.author.link
              ? `<a href="${b.author.link}">${b.author.name}</a>`
              : `<span>${b.author.name}</span>`
          }
        </dd>
        <dd>
          Date:
            ${
              b.dates.published
                ? `<span>Published:</span> <span>${b.dates.published}</span>`
                : ``
            }
            ${
              b.dates.updated
                ? `<span>Updated: </span> <span>${b.dates.updated}</span>`
                : ""
            }
            ${
              b.dates.completed
                ? `<span>Completed: </span> <span>${b.dates.completed}</span>`
                : ""
            }
        </dd>
        <dd>
          Comments: ${unified().use(remarkParse).use(remarkGfm).use(remarkRehype).use(rehypeStringify).processSync(b.comments).toString()}
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
