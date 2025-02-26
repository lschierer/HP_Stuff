export const prerender = true; // this page, using node:fs, *must* be SSR.
import fs from "node:fs";

import { DateTime } from "luxon";

import markdownTextProcessing from "../../lib/customMarkdownProcessing.ts";

import { type Compilation, type Route } from "../../lib/greenwoodPages.ts";
import {
  Event,
  Events,
  type DisplayableEvent,
} from "../../lib/TimelineTypes.ts";

import debugFunction from "../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
const DEBUG1 = debugFunction(`${new URL(import.meta.url).pathname}.1`);
const DEBUG2 = debugFunction(`${new URL(import.meta.url).pathname}.2`);

if (DEBUG || DEBUG1 || DEBUG2) {
  console.log(
    `DEBUG: ${DEBUG} for ${new URL(import.meta.url).pathname}`,
    `DEBUG1: ${DEBUG1} for ${new URL(import.meta.url).pathname}`,
    `DEBUG2: ${DEBUG2} for ${new URL(import.meta.url).pathname}`
  );
}

const parseEvent = (
  event: Event,
  fileName: string
): DisplayableEvent | undefined => {
  let description: string | undefined = undefined;
  if (event.description !== null && event.description !== undefined) {
    description = markdownTextProcessing(event.description);
  }
  let source: string | undefined = undefined;
  if (event.source !== null && event.source !== undefined) {
    source = markdownTextProcessing(event.source);
  }
  let eventDate: DateTime | undefined = undefined;
  if (event.date == null || event.date == undefined) {
    if (DEBUG2) {
      console.log(`no date in event, filename is '${fileName}'`);
    }
    while (fileName.includes("/")) {
      if (fileName.indexOf("/") == fileName.length - 1) {
        fileName = fileName.slice(0, -1);
        continue;
      }
      if (fileName.indexOf("/") == 0) {
        fileName = fileName.slice(1);
        continue;
      }
      fileName = fileName.split("/").pop() ?? "";
      if (fileName.endsWith(".json")) {
        fileName = fileName.slice(0, -5).padStart(4, "0");
      }
    }

    if (DEBUG2) {
      console.log(`finalized filename is '${fileName}'`);
    }
    if (fileName.endsWith("s")) {
      fileName = fileName.slice(0, -1).padStart(4, "0");
      eventDate = DateTime.fromISO(fileName);
    } else {
      eventDate = DateTime.fromISO(fileName);
    }
  } else if (typeof event.date === "string") {
    if (DEBUG2) {
      console.log(`detected date '${event.date} as string`);
    }
    eventDate = DateTime.fromISO(event.date.padStart(4, "0"));
  } else if (typeof event.date === "number") {
    if (DEBUG2) {
      console.log(`detected date '${event.date} as number`);
    }
    eventDate = DateTime.fromISO(event.date.toString().padStart(4, "0"));
  } else {
    if (DEBUG2) {
      console.log(`detected date '${event.date.toString()} as JSDate`);
    }
    eventDate = DateTime.fromJSDate(event.date);
  }
  if (eventDate.isValid) {
    if (DEBUG2) {
      console.log(
        `finalized date is ${eventDate.toString()} for event ${JSON.stringify(event)}`
      );
    }
  } else {
    console.log(
      `invalid date '${eventDate.toString()} ' for event ${JSON.stringify(event)}`
    );
    return;
  }
  const ne: DisplayableEvent = {
    date: eventDate.toJSDate(),
    type: event.type,
    blurb: event.blurb,
    description: description,
    source: source,
  };
  return ne;
};

const getCollectionContents = () => {
  if (DEBUG) {
    console.log(`History getCollectionContents cwd is ${process.cwd()}`);
  }
  const matches = fs.globSync("./src/assets/history/*.json");
  const _events = new Array<DisplayableEvent>();

  if (Array.isArray(matches) && matches.length > 0) {
    if (DEBUG) {
      console.log(
        `History getCollectionContents fs.globSync has things to process`
      );
    }
    matches.sort().map((match) => {
      if (DEBUG1) {
        console.log(`History getCollectionContents matches ${match}`);
      }
      const file = fs.readFileSync(match, "utf8");
      if (file) {
        const singleEvent = Event.safeParse(JSON.parse(file));
        if (singleEvent.success) {
          if (DEBUG1) {
            console.log(`processing '${match} as single event`);
          }
          const ne = parseEvent(singleEvent.data, match);
          if (ne) {
            _events.push(ne);
          }
        } else {
          if (DEBUG1) {
            console.log(`processing '${match} as array of events`);
          }
          const arrayEvents = Events.safeParse(JSON.parse(file));
          if (arrayEvents.success) {
            arrayEvents.data.events.map((se) => {
              if (DEBUG1) {
                console.log(`processing array event '${JSON.stringify(se)}'`);
              }
              const ne = parseEvent(se, match);
              if (ne) {
                _events.push(ne);
              }
            });
          } else {
            console.log(
              `both singleEvent and arrayEvent failed. singleEvent: ${singleEvent.error.message}, arrayEvent: ${arrayEvents.error.message}`
            );
          }
        }
      } else {
        console.error(
          `error reading file data for ${match}, it returned falsy`
        );
      }
    });
  } else {
    console.error(matches);
    return;
  }
  return _events;
};

async function getBody(compilation: Compilation, route: Route) {
  const _events = getCollectionContents();
  if (_events) {
    if (DEBUG) {
      console.log(
        `History getBody after getCollectionContents, _events has ${_events.length} events.`
      );
    }
    return `
    <div class="banner spectrum-AlertBanner is-open spectrum-AlertBanner--info">
      <div class=" spectrum-AlertBanner-body ">
      <iconify-icon icon="octicon:info-16" ></iconify-icon>
        <div class=" spectrum-AlertBanner-content ">
          <p class=" spectrum-AlertBanner-text ">
            Note that the tool creating this timeline fills in unknown fields in dates.
          </p>
        </div>

      </div>
    </div>

    <vertical-timeline events="${encodeURIComponent(JSON.stringify(_events))}"></vertical-timeline>
  `;
  } else {
    return `
      <div>
        <p>No Events Found</p>
      </div>
    `;
  }
}

async function getLayout(compilation: Compilation, route: Route) {
  if (DEBUG) {
    console.log(`route is ${JSON.stringify(route)}`);
  }
  return `
  <!doctype html>
  <html>
    <head>
      <script type="module" src="../components/side-nav.ts"></script>
      <script type="module" src="../components/v-timeline.ts"></script>
      <script type="module" src="../lib/Spectrum/SplitView.ts"></script>
    </head>

    <body>
      ${DEBUG ? `<span>History Layout </span>` : ""}
      <sp-split-view resizable primary-size="20%">
        <div class="nav">
          <side-nav route="${route.route}"></side-nav>
        </div>
        <div>
          <main >
            <content-outlet></content-outlet>
          </main>
        </div>
      </sp-split-view>
    </body>
  </html>

  `;
}

async function getFrontmatter(
  compilation: Compilation,
  route: Route,
  label: string,
  id: string
) {
  return {
    collection: "Harrypedia",
    title: "History",
    author: "Luke Schierer",
    tableOfContents: false,
  };
}

export { getFrontmatter, getBody, getLayout };

/*
---
collection: Harrypedia
layout: timeline
title: History
author: Luke Schierer
tableOfContents: false
banner:
  content: |
    Note that the tool creating this timeline fills in
    unknown fields in dates.
import:
- /components/vertical-timeline.ts type="module"
- /components/vertical-element.ts type="module"
---


<vertical-timeline datacollection="history" ></vertical-timeline>
 */
