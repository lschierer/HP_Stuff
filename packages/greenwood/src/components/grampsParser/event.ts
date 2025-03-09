import GrampsCSS from "../../styles/Gramps.css" with { type: "css" };

import { type GedcomEvent } from "../../schemas/gedcom/index.ts";

import debugFunction from "../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

import GrampsState from "./state.ts";
import { getGrampsData } from "./state.ts";

export default class EventWrapper extends HTMLElement {
  public handle: string = "";
  public type: string | undefined = undefined;

  private event: GedcomEvent.GedcomElement | undefined = undefined;
  private date: string = "";
  private fromdate: string = "";
  private todate: string = "";
  private isinterval: boolean = false;
  private entries = new Array<GedcomEvent.GedcomElement>();

  protected populateLocalAttributes = () => {
    for (const attr of this.attributes) {
      if (DEBUG) {
        console.log(`attr has name ${attr.name}`);
      }
      if (!attr.name.toLowerCase().localeCompare("type")) {
        if (DEBUG) {
          console.log(`found familyname attr with value ${attr.value}`);
        }
        this.type = attr.value;
      }
      if (!attr.name.toLowerCase().localeCompare("handle")) {
        this.handle = attr.value;
      }
    }
    if (DEBUG) {
      console.log(`looking for handle "${this.handle}"`);
    }
  };

  protected getGedcomData = async () => {
    if (GrampsState.events.size == 0) {
      await getGrampsData(import.meta.url);
    }

    if (this.handle.length > 0) {
      this.event = GrampsState.events.get(this.handle);
    } else {
      if (this.type != undefined) {
        GrampsState.events.forEach((entry) => {
          entry.attribute_list.map((attribute) => {
            if (!attribute.type.string.localeCompare(this.type ?? "")) {
              this.event = entry;
            }
          });
        });
      } else {
        this.event = (
          GrampsState.events.entries().next().value as Array<
            number | GedcomEvent.GedcomElement
          >
        )[1] as GedcomEvent.GedcomElement;
      }
    }

    if (this.event != undefined) {
      if (this.event.date != null) {
        if (this.event.date.dateval.length >= 3) {
          if (this.event.date.dateval.length <= 4) {
            if (DEBUG) {
              console.log(
                `event.date.dateval.length is ${this.event.date.dateval.length} indicating a date not an interval`
              );
            }
            if (this.event.date.dateval[2] != 0) {
              if (this.event.date.dateval[1] != 0) {
                if (this.event.date.dateval[0] != 0) {
                  this.fromdate = `${this.event.date.dateval[2]}-${this.event.date.dateval[1]}-${this.event.date.dateval[0]}`;
                } else {
                  this.fromdate = `${this.event.date.dateval[2]}-${this.event.date.dateval[1]}`;
                }
              } else {
                this.fromdate = `${this.event.date.dateval[2]}`;
              }
            }
          } else {
            if (DEBUG) {
              console.log(
                `event.date.dateval.length is ${this.event.date.dateval.length} indicating an interval`
              );
            }
            if (this.event.date.dateval[2] != 0) {
              if (this.event.date.dateval[1] != 0) {
                if (this.event.date.dateval[0] != 0) {
                  this.fromdate = `${this.event.date.dateval[2]}-${this.event.date.dateval[1]}-${this.event.date.dateval[0]}`;
                } else {
                  this.fromdate = `${this.event.date.dateval[2]}-${this.event.date.dateval[1]}`;
                }
              } else {
                this.fromdate = `${this.event.date.dateval[2]}`;
              }
            }
            if (this.event.date.dateval[6] != 0) {
              if (this.event.date.dateval[5] != 0) {
                if (this.event.date.dateval[4] != 0) {
                  this.todate = `${this.event.date.dateval[6]}-${this.event.date.dateval[5]}-${this.event.date.dateval[4]}`;
                } else {
                  this.todate = `${this.event.date.dateval[6]}-${this.event.date.dateval[5]}`;
                }
              } else {
                this.todate = `${this.event.date.dateval[6]}`;
              }
            }
            this.isinterval = true;
          }
        } else if (this.event.date.text.length > 0) {
          const regex = /\d{4}-\d{2}-\d{2}/;
          if (regex.test(this.event.date.text)) {
            this.date = this.event.date.text;
          }
        }
      }
    }
  };

  async connectedCallback() {
    this.populateLocalAttributes();
    await this.getGedcomData();
    this.attachShadow({ mode: "open" });
    if (this.shadowRoot) {
      this.shadowRoot.adoptedStyleSheets.push(GrampsCSS);
      if (this.isinterval && this.event != undefined) {
        if (DEBUG) {
          console.log(`isinterval and event`);
        }
        this.shadowRoot.innerHTML = `
          <gramps-event isinterval fromdate=${this.fromdate} todate=${this.todate} ></gramps-event>
        `;
      }
      if (!this.isinterval && this.event != undefined && this.date.length > 0) {
        if (DEBUG) {
          console.log(`not isinterval and event and date`);
        }
        this.shadowRoot.innerHTML = `
          <gramps-event datestring=${this.date} ></gramps-event>
        `;
      }
      if (
        !this.isinterval &&
        this.event != undefined &&
        this.date.length == 0
      ) {
        if (DEBUG) {
          console.log(`not isinterval and event not date`);
        }
        this.shadowRoot.innerHTML = `
          <span>${this.event.date?.text}</span>
        `;
      }
    }
  }
}
customElements.define("gedcom-event", EventWrapper);

import { DateTime, Interval } from "luxon";

class GrampsEvent extends HTMLElement {
  public datestring: string = "";
  public fromdate: string = "";
  public todate: string = "";
  public isinterval: boolean = false;
  private displayable: boolean = false;
  private _date: DateTime = DateTime.now();
  private _interval: Interval | undefined = undefined;

  protected willUpdate(): void {
    const attributes = this.getAttributeNames();
    if (
      attributes.includes("fromdate") &&
      attributes.includes("todate") &&
      attributes.includes("isinterval")
    ) {
      this.isinterval = attributes.includes("isinterval");
      this.fromdate = this.getAttribute("fromdate") ?? "";
      this.todate = this.getAttribute("todate") ?? "";
      if (
        !this.isinterval &&
        (this.fromdate.length > 0 || this.todate.length > 0)
      ) {
        console.error(`isInterval must be true if fromdate or todate are used`);
        this.displayable = false;
      } else if (this.isinterval && this.fromdate.length == 0) {
        console.error(`fromdate must be set when isinterval is true.`);
        this.displayable = false;
      } else if (this.isinterval && this.todate.length == 0) {
        console.error(`todate must be set when isinterval is true.`);
        this.displayable = false;
      } else {
        if (DEBUG) {
          console.log(
            `isinterval: ${this.isinterval} fromdate: ${this.fromdate} todate: ${this.todate} datestring: ${this.datestring}`
          );
        }
        this._interval = Interval.fromDateTimes(
          DateTime.fromISO(this.fromdate),
          DateTime.fromISO(this.todate)
        );
        if (this._interval.isValid) {
          this.displayable = true;
        }
      }
    } else if (
      !attributes.includes("isinterval") &&
      attributes.includes("datestring")
    ) {
      this.datestring = this.getAttribute("datestring") ?? "";
      if (this.datestring.length > 0) {
        this._date = DateTime.fromISO(this.datestring);
        if (this._date.isValid) {
          this.displayable = true;
        } else {
          console.error(`invalid date ${this.datestring}`);
        }
      }
    } else {
      console.error(`invalid attribute combination used.`);
      this.displayable = false;
    }
  }

  connectedCallback() {
    this.willUpdate();
    console.log(`displayable is ${this.displayable}`);
    if (DEBUG) {
    }
    if (this.displayable) {
      if (this.isinterval && this._interval != undefined) {
        this.innerHTML = this._interval.toISODate();
      } else {
        this.innerHTML = `${this._date.toISO()}`;
      }
    } else {
      this.innerHTML = "";
    }
  }
}
customElements.define("gramps-event", GrampsEvent);
