import { DateTime } from "luxon";
import { Event, type DisplayableEvent } from "../lib/TimelineTypes.ts";

import debugFunction from "../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
} else {
  console.log(`debug not enabled for ${new URL(import.meta.url).pathname}`);
}
export default class VerticalTimeline extends HTMLElement {
  public events: string = "";
  private _events: DisplayableEvent[] = new Array<DisplayableEvent>();

  private getEvents() {
    const _changedProperties = this.getAttributeNames();
    if (_changedProperties.includes("events")) {
      this.events = this.getAttribute("events") ?? "";
      if (DEBUG) {
        console.log(
          `VerticalTimeline willUpdate detected change to this.events ${decodeURIComponent(this.events)}`
        );
      }
      if (
        Array.isArray(JSON.parse(decodeURIComponent(this.events))) &&
        this.events.length > 0
      ) {
        if (DEBUG) {
          console.log(`VerticalTimeline getEvents found an events array`);
        }
        const validate = Event.array().safeParse(
          JSON.parse(decodeURIComponent(this.events))
        );
        if (validate.success) {
          validate.data.map((event) => {
            this._events.push({
              type: event.type,
              blurb: event.blurb,
              description: event.description,
              source: event.source,
              date: event.date
                ? DateTime.fromISO(event.date as string).toJSDate()
                : "unknown date",
            });
          });
        } else {
          console.error(
            `this.events  is something odd, ${validate.error.message}`
          );
        }
      } else {
        if (DEBUG) {
          console.log(
            `this.events is ${Array.isArray(JSON.parse(decodeURIComponent(this.events)))} `
          );
          if (Array.isArray(this.events)) {
            console.log(`this.events has length ${this.events.length}`);
          }
        }
      }
    }
  }

  connectedCallback() {
    if (DEBUG) {
      console.log(`VerticalTimeline connectedCallback`);
    }
    this.getEvents();
    if (Array.isArray(this._events) && this._events.length > 0) {
      if (DEBUG) {
        console.log(`VerticalTimeline connectedCallback I have events`);
      }
      this._events.sort((a, b) => {
        if (a.date == "unknown date") {
          if (b.date == "unknown date") {
            return 0;
          } else return -1;
        } else if (b.date == "unknown date") {
          return 1;
        } else if (a.date < b.date) {
          return -1;
        } else if (a.date > b.date) {
          return 1;
        } else {
          return 0;
        }
      });
      const template = this._events
        .map((event, index) => {
          const date =
            event.date != "unknown date"
              ? DateTime.fromJSDate(event.date)
              : DateTime.now();
          const description = event.description ? event.description : "";
          const source =
            event.source && event.source !== ""
              ? `
            <a href="#${date.toUnixInteger()}-${index}">
              Sources # ${index + 1}
            </a>
            `
              : "";
          const returnable = `
            <li id="${date.toUnixInteger().toString()}">
              <h5 class=" spectrum-Heading spectrum-Heading--sizeM">
                ${date.toISODate()}
              </h5>
              <div class="${event.type} spectrum-Typography">
                <h6 class=" spectrum-Heading spectrum-Heading--sizeXS">
                  ${event.blurb}
                  <a name="${date.toUnixInteger()}-${index}-item">&nbsp;</a>
                </h6>
                ${description}
                ${source}
              </div>
            </li>
          `;
          return returnable;
        })
        .join(" ");
      this.innerHTML = `
        <link rel="stylesheet" href="/styles/Timeline.css" />

        <section class="timeline">
          <ul class="timeline spectrum-Typography">
            ${template}
          </ul>
        </section>

        <section  class="footnotes">
          <h2 class=" spectrum-Heading spectrum-Heading--sizeS">
            Sources
          </h5>
            <ol class="footnotes spectrum-Typography">
                ${this._events
                  .map((entry, index) => {
                    if (entry.source !== "") {
                      const date =
                        entry.date != "unknown date"
                          ? DateTime.fromJSDate(entry.date)
                          : DateTime.now();
                      return `
                      <li class="footnote spectrum-Typography">
                        <a name="${date.toUnixInteger()}-${index}">
                          ${entry.source}
                        </a>
                        <span class="spectrum-Body spectrum-Body--sizeS"><a href="#${date.toUnixInteger()}-${index}-item">return to entry &crarr;</a></span>
                      </li>

                    `;
                    } else {
                      return "";
                    }
                  })
                  .join(" ")}
            </ol>
        </section>
      `;
    } else {
      this.innerHTML = "";
    }
  }
}
customElements.define("vertical-timeline", VerticalTimeline);
