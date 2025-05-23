import { Bookmark } from "@hp-stuff/schemas";

import debugFunction from "./debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

import markdownTextProcessing from "../lib/customMarkdownProcessing.ts";

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
          <span class=" spectrum-Detail spectrum-Detail--sizeM spectrum-Detail-strong ">Author: </span> <span class="spectrum-Body spectrum-Body--serif spectrum-Body--sizeXS">
          ${
            b.author.link
              ? `<a
                  href="${b.author.link}"
                  class=" spectrum-Link spectrum-Link--quiet spectrum-Link--primary "
                  >${b.author.name}</a>`
              : `<span>${b.author.name}</span>`
          }
          </span>
        </dd>
        <dd>
          <span class="spectrum-Detail spectrum-Detail--sizeM spectrum-Detail-strong ">Date(s): </span><br/>
            <ul class="dateList">
            ${
              b.dates.series_start
                ? `
                  <li class="spectrum-Detail spectrum-Detail--sizeM">
                    <span class="spectrum-Detail-strong ">Series Started:</span>
                    <span class="spectrum-Detail--light">${b.dates.series_start}</span>
                  </li>
                `
                : ""
            }
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
          <span class=" spectrum-Detail spectrum-Detail--sizeM spectrum-Detail-strong">Comments: </span> ${markdownTextProcessing(b.comments)}
        </dd>
      `;
      })
      .join("\n");
  };

  readonly ParseBookmarks = (bookmarkData: object[]) => {
    if (bookmarkData.length) {
      if (DEBUG) {
        console.log(
          `ParseBookmarks read in data from file for '${this.category}`
        );
      }
      const valid = Bookmark.array().safeParse(bookmarkData);
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
