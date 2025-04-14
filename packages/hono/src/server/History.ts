import fs from "node:fs";
import { Hono } from "hono";

import { DateTime } from "luxon";
import type { Root, RootContent, Element } from "hast";
import { unified } from "unified";

import { defaultLayout } from "./layout";
import { fromHtml } from "hast-util-from-html";
import { h } from "hastscript";
import { visit } from "unist-util-visit";
import rehypeStringify from "rehype-stringify";
import { ParsedResult } from "@schemas/page";
import { parseHtmlToHast, parseMarkdownToHast } from "./parseToHast";

import { Event, Events, type DisplayableEvent } from "@shared/TimelineTypes";

import debugFunction from "@shared/debug";
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
const app = new Hono();

app.get("/", async (c) => {
  if (DEBUG) {
    console.log(`matched the root route for the History Module`);
  }
  const ast = await getBody();
  const body = unified().use(rehypeStringify).stringify(ast);
  const result = await defaultLayout({
    title: "History",
    route: "/Harrypedia/History",
    content: body,
  });

  if (typeof result === "string") {
    return c.html(result);
  } else if (ParsedResult.safeParse(result).success) {
    return c.html(result.html);
  } else {
    if (DEBUG) {
      console.error(`unknown result type for /Harrypedia/History`);
    }
    return c.notFound();
  }
});

export default app;

const parseEvent = async (
  event: Event,
  fileName: string
): Promise<DisplayableEvent | undefined> => {
  let description: Root | undefined = undefined;
  if (event.description !== undefined) {
    description = await parseMarkdownToHast(event.description);
  }
  let source: Root | undefined = undefined;
  if (event.source !== null && event.source !== undefined) {
    source = await parseMarkdownToHast(event.source);
  }
  let eventDate: DateTime | undefined = undefined;
  if (event.date == undefined) {
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

const getCollectionContents = async () => {
  if (DEBUG) {
    console.log(`History getCollectionContents cwd is ${process.cwd()}`);
  }
  const matches = fs.globSync("./src/assets/History/*.json");
  const _events = new Array<DisplayableEvent>();

  if (Array.isArray(matches) && matches.length > 0) {
    if (DEBUG) {
      console.log(
        `History getCollectionContents fs.globSync has things to process`
      );
    }
    await Promise.all(
      matches.sort().map(async (match) => {
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
            const ne = await parseEvent(singleEvent.data, match);
            if (ne) {
              _events.push(ne);
            }
          } else {
            if (DEBUG1) {
              console.log(`processing '${match} as array of events`);
            }
            const arrayEvents = Events.safeParse(JSON.parse(file));
            if (arrayEvents.success) {
              await Promise.all(
                arrayEvents.data.events.map(async (se) => {
                  if (DEBUG1) {
                    console.log(
                      `processing array event '${JSON.stringify(se)}'`
                    );
                  }
                  const ne = await parseEvent(se, match);
                  if (ne) {
                    _events.push(ne);
                  }
                })
              );
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
      })
    );
  } else {
    console.error(matches);
  }
  return _events;
};

const sortDisplayableEvents = (a: DisplayableEvent, b: DisplayableEvent) => {
  if (a.date === undefined) {
    if (b.date === undefined) {
      return 0;
    }
    return -1;
  } else if (b.date === undefined) {
    return 1;
  } else if (a.date == "unknown date") {
    if (b.date == "unknown date") {
      return 0;
    }
    return -1;
  } else if (b.date == "unknown date") {
    return 1;
  } else if (a.date < b.date) {
    return -1;
  } else if (a.date > b.date) {
    return 1;
  }
  return 0;
};

const renderEvent = (event: DisplayableEvent, index: number): Element => {
  const date = event.date
    ? event.date !== "unknown date"
      ? typeof event.date === "string" || typeof event.date === "number"
        ? DateTime.fromISO(event.date as string)
        : DateTime.fromJSDate(event.date)
      : DateTime.now()
    : DateTime.now();

  const dateStr = date.toISODate();
  const unixId = date.toUnixInteger();

  const sourceLink = event.source
    ? `<a href="#${unixId}-${index}">Sources # ${index + 1}</a>`
    : "";

  const html = `
    <h5 class="spectrum-Heading spectrum-Heading--sizeM">${dateStr}</h5>
    <div class="${event.type} spectrum-Typography">
      <h6 class="spectrum-Heading spectrum-Heading--sizeXS">
        ${event.blurb}
        <a name="${unixId}-${index}-item">&nbsp;</a>
      </h6>
      ${sourceLink}
    </div>
  `;

  const frag = fromHtml(html, { fragment: true });
  return h("li", frag.children);
};

const getBody = async () => {
  const _events = (await getCollectionContents()).sort((a, b) =>
    sortDisplayableEvents(a, b)
  );

  if (DEBUG) {
    console.log(
      `History getBody after getCollectionContents, _events has ${_events.length} events.`
    );
  }

  const renderedItems = _events.map((e, i) =>
    renderEvent(e, i)
  ) as RootContent[];

  const template = parseHtmlToHast(`
    <div class="history">
      <link rel="stylesheet" href="/styles/Timeline.css" />
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

      <section class="timeline">
        <ul class="timeline spectrum-Typography">
          <vertical-timeline></vertical-timeline>
        </ul>
      </section>
    </div>
  `);

  visit(template, "element", (node, index, parent) => {
    if (node.tagName === "vertical-timeline" && parent) {
      parent.children.splice(index ?? 0, 1, ...renderedItems);
    }
  });

  return template;
};
