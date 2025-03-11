import { getContentByRoute } from "@greenwood/cli/src/data/client.js";

import "iconify-icon";
import "@spectrum-web-components/card/sp-card.js";

import { type Page } from "@greenwood/cli";

import * as Greenwood from "../lib/greenwoodPages.ts";

import debugFunction from "../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

import SpectrumCSScard from "@spectrum-css/card/dist/index.css" with { type: "css" };
import SpectrumCSSlink from "@spectrum-css/link/dist/index.css" with { type: "css" };
import DirectoryIndexCSS from "../styles/DirectoryIndex.css" with { type: "css" };

export default class DirectoryIndex extends HTMLElement {
  private _directory = "";
  private _entries = new Array<Page>();
  private _recurse = false;

  async connectedCallback() {
    if (DEBUG) {
      console.log(`I have attributes ${JSON.stringify(this.attributes)}`);
    }
    for (const attr of this.attributes) {
      if (DEBUG) {
        console.log(`evaluating attr ${attr.name} with value ${attr.value}`);
      }
      if (!attr.name.localeCompare("directory")) {
        if (DEBUG) {
          console.log(`setting directory attribute`);
        }
        this._directory = attr.value;
      }
      if (!attr.name.localeCompare("recurse")) {
        this._recurse = true;
      }
    }
    if (this._directory.includes("/")) {
      const stack = this._directory.split("/");
      this._directory = stack.map((s) => encodeURIComponent(s)).join("/");
    }
    await this.getEntries();
    this.renderEntries();
  }

  protected getEntries = async () => {
    if (DEBUG) {
      console.log(`DirectoryIndex getEntries for ${this._directory}`);
    }
    const entries = (
      (await getContentByRoute(
        this._directory.length > 0 ? this._directory : "/"
      )) as Array<Page | undefined>
    ).sort((a: Page | undefined, b: Page | undefined) => {
      if (a == undefined) {
        if (b == undefined) {
          return 0;
        } else {
          return -1;
        }
      } else if (b == undefined) {
        return 1;
      } else {
        return Greenwood.sortbyfrontmatter(a, b)
          ? Greenwood.sortbyfrontmatter(a, b)
          : Greenwood.sortbyTitle(a, b)
            ? Greenwood.sortbyTitle(a, b)
            : Greenwood.sortbylabel(a, b)
              ? Greenwood.sortbylabel(a, b)
              : Greenwood.sortbyContainsRoute(a, b);
      }
    });
    entries.map((entry) => {
      if (entry) {
        if (
          entry.route.localeCompare(this._directory) &&
          entry.route.startsWith(this._directory)
        ) {
          if (this._recurse) {
            this._entries.push(entry);
          } else {
            if (DEBUG) {
              console.log(`recurse set to false`);
            }
            const stack = entry.route.split("/");
            const routeStack = this._directory.split("/");
            if (DEBUG) {
              console.log(`entry ${entry.route} stack size ${stack.length}`);
            }
            if (stack.length <= routeStack.length + 1) {
              this._entries.push(entry);
            }
          }
        } else {
          if (DEBUG) {
            if (
              !entry.route.localeCompare(encodeURIComponent(this._directory))
            ) {
              console.log(
                `excluding matching route ${entry.route} the same as ${this._directory}`
              );
            } else {
              console.log(
                `excluding non-matching route ${entry.route} while comparing ${this._directory}`
              );
            }
          }
        }
      }
    });
  };

  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this.renderEntries();
  }

  renderEntries() {
    if (this._entries.length > 0) {
      if (DEBUG) {
        console.log(
          `DirectoryIndex connectedCallback sees ${this._entries.length} entries after getEntries() call`
        );
      }

      if (this.shadowRoot) {
        this.shadowRoot.adoptedStyleSheets.push(SpectrumCSScard);
        this.shadowRoot.adoptedStyleSheets.push(SpectrumCSSlink);
        this.shadowRoot.adoptedStyleSheets.push(DirectoryIndexCSS);

        this.shadowRoot.innerHTML = `
          <div class="cardBox directoryIndex">
              <div class="offsetter">${DEBUG ? this._entries.length : ""}</div>

              ${this._entries
                .map((entry, index) => {
                  const imgTemplate = `
                    <iconify-icon
                      icon="lucide:book-up"
                      slot="preview"
                      width="3rem"
                      >
                    </iconify-icon>
                  `;
                  const descriptionTemplate = `
                    <div slot="description"> ${
                      entry.data
                        ? entry.data.description
                          ? entry.data.description
                          : ""
                        : ""
                    }
                    </div>
                  `;
                  return `
                  <div class="cardItem">
                    <sp-card
                      horizontal
                      variant="quiet"
                      heading="${entry.title ? entry.title : entry.label}"
                      subheading=""
                      href="${entry.route}"
                      value="card-${index}"
                    >
                      ${imgTemplate}
                      ${
                        entry.data
                          ? entry.data.description
                            ? descriptionTemplate
                            : ""
                          : ""
                      }

                    </sp-card>
                  </div>
                `;
                })
                .join("")}
            </ul>
          </div>
        `;
      } else {
        if (DEBUG) {
          console.log(`shadow root is not accessible`);
        }
      }
    } else {
      if (DEBUG) {
        const template = `
          <span>No entries found for '${this._directory}'</span>
        `;
        if (this.shadowRoot) {
          this.shadowRoot.innerHTML = template;
        }
        this.innerHTML = template;
      } else {
        const template = `
          <!-- No Entries found for ${this._directory} -->
        `;
        if (this.shadowRoot) {
          this.shadowRoot.innerHTML = template;
        } else {
          this.innerHTML = template;
        }
      }
    }
  }
}
customElements.define("directory-index", DirectoryIndex);
