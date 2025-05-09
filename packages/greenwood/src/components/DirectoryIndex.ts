import { getContentByRoute } from "@greenwood/cli/src/data/client.js";
import { type Page } from "@greenwood/cli";
import "@spectrum-web-components/card/sp-card.js";

//import debugFunction from "../lib/debug.ts";
const DEBUG = true; //debugFunction(new URL(import.meta.url).pathname);
console.log(`DEBUG for ${new URL(import.meta.url).pathname} is ${DEBUG}`);

export default class DirectoryIndex extends HTMLElement {
  private _directory = "";
  private _routes = new Set<string>();
  private _entries = new Array<Page>();
  private _recurse = false;
  private _observer: ResizeObserver | null = null;

  // Define which attributes to observe for changes
  static get observedAttributes() {
    return ["directory", "recurse"];
  }

  // Handle attribute changes
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (DEBUG) {
      console.log(`Attribute ${name} changed from ${oldValue} to ${newValue}`);
    }

    if (name === "directory" && newValue !== oldValue) {
      this._directory = newValue || "";
      this.normalizeDirectoryPath();

      // Re-fetch entries when directory changes
      if (this.isConnected) {
        this._entries = [];
        this._routes.clear();
        this.getEntries()
          .then(() => {
            this.renderEntries();
          })
          .catch((err: unknown) => {
            console.error(`there was an error getting entries: ${String(err)}`);
          });
      }
    }

    if (name === "recurse") {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      this._recurse = newValue !== null && newValue !== "";
      // Re-fetch entries when recurse changes
      if (this.isConnected) {
        this._entries = [];
        this._routes.clear();
        this.getEntries()
          .then(() => {
            this.renderEntries();
          })
          .catch((err: unknown) => {
            console.error(`there was an error getting entries: ${String(err)}`);
          });
      }
    }
  }

  // Helper method to normalize directory path
  private normalizeDirectoryPath() {
    // URL encode path segments
    if (this._directory.includes("/")) {
      const stack = this._directory.split("/");
      this._directory = stack.map((s) => encodeURIComponent(s)).join("/");
    } else if (this._directory) {
      this._directory = encodeURIComponent(this._directory);
    }

    // Ensure directory starts with a slash
    if (this._directory && !this._directory.startsWith("/")) {
      this._directory = "/" + this._directory;
    }

    // Ensure directory ends with a slash for consistent path matching
    if (
      this._directory &&
      this._directory !== "/" &&
      !this._directory.endsWith("/")
    ) {
      this._directory = this._directory + "/";
    }

    if (DEBUG) {
      console.log(`Normalized directory path: ${this._directory}`);
    }
  }

  protected getAttributes = () => {
    if (DEBUG) {
      console.log(`I have attributes ${JSON.stringify(this.attributes)}`);
    }

    // Check for directory attribute
    if (this.hasAttribute("directory")) {
      const directoryValue = this.getAttribute("directory");
      if (DEBUG) {
        console.log(`setting directory attribute to ${directoryValue}`);
      }
      this._directory = directoryValue || "";
    }

    // Check for recurse attribute
    this._recurse = this.hasAttribute("recurse");
    if (DEBUG && this._recurse) {
      console.log("recurse attribute is set");
    }

    // Normalize the directory path
    this.normalizeDirectoryPath();
  };

  protected getEntries = async () => {
    if (DEBUG) {
      console.log(`DirectoryIndex getEntries for ${this._directory}`);
    }

    // Clear existing entries and routes
    this._entries = [];
    this._routes = new Set<string>();

    // Normalize directory path for consistency
    const directoryPath = this._directory.length > 0 ? this._directory : "/";

    if (DEBUG) {
      console.log(`Fetching content for path: ${directoryPath}`);
    }

    try {
      const entries = (
        (await getContentByRoute(directoryPath)) as Array<Page | undefined>
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
          const ordera = a.data
            ? Object.keys(a.data).includes("order")
              ? (a.data["order" as keyof typeof a.data] as number)
              : undefined
            : undefined;

          const orderb = b.data
            ? Object.keys(b.data).includes("order")
              ? (b.data["order" as keyof typeof b.data] as number)
              : undefined
            : undefined;

          if (ordera && orderb) {
            return ordera - orderb;
          } else if (ordera) {
            return -1;
          } else if (orderb) {
            return 1;
          } else {
            return a.title.localeCompare(b.title);
          }
        }
      });

      entries.forEach((entry) => {
        if (!entry) return;

        if (DEBUG) {
          console.log(
            `Evaluating entry: ${entry.route} (comparing with ${this._directory})`
          );
        }

        // Check if this entry is a child of the current directory
        if (
          entry.route !== this._directory &&
          entry.route.startsWith(this._directory)
        ) {
          // For recursive mode, include all descendants
          if (this._recurse) {
            if (!this._routes.has(entry.route)) {
              if (DEBUG) {
                console.log(`Adding entry (recursive): ${entry.route}`);
              }
              this._entries.push(entry);
              this._routes.add(entry.route);
            }
          } else {
            // For non-recursive mode, only include direct children
            const stack = entry.route.split("/");
            const routeStack = this._directory.split("/");

            if (DEBUG) {
              console.log(
                `Entry ${entry.route} path depth: ${stack.length}, directory depth: ${routeStack.length}`
              );
            }

            // Only include if it's a direct child (one level deeper than current directory)
            if (stack.length <= routeStack.length + 1) {
              if (!this._routes.has(entry.route)) {
                if (DEBUG) {
                  console.log(`Adding entry (direct child): ${entry.route}`);
                }
                this._entries.push(entry);
                this._routes.add(entry.route);
              }
            }
          }
        } else {
          if (DEBUG) {
            if (entry.route === this._directory) {
              console.log(
                `Excluding entry (same as current directory): ${entry.route}`
              );
            } else {
              console.log(
                `Excluding entry (not a child of current directory): ${entry.route}`
              );
            }
          }
        }
      });

      if (DEBUG) {
        console.log(
          `Found ${this._entries.length} entries for directory: ${this._directory}`
        );
      }
    } catch (error) {
      console.error(`Error fetching entries: ${String(error)}`);
      throw error;
    }
  };

  renderEntries() {
    if (this._entries.length > 0) {
      if (DEBUG) {
        console.log(
          `DirectoryIndex connectedCallback sees ${this._entries.length} entries after getEntries() call`
        );
      }

      this.innerHTML = `
        <link rel="stylesheet" href="/node_modules/@hp-stuff/assets/dist/styles/DirectoryIndex.css" />
        <div class="directory-index-container">
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

                return `
                <div class="directory-card" data-index="${index}">
                  <a href="${entry.route}" class="spectrum-Link spectrum-Link--quiet spectrum-Link--secondary">
                  <div class="spectrum-Card spectrum-Card--horizontal" role="figure">
                    <div class="spectrum-Card-preview">
                      ${imgTemplate}
                    </div>
                    <div class="spectrum-Card-body">
                      <div class="spectrum-Card-header">
                        <div class="spectrum-Card-title">
                          ${entry.title ? entry.title : entry.label}
                        </div>
                      </div>
                      <div class="spectrum-Card-content">
                        <div class="spectrum-Card-description">
                        ${
                          entry.data
                            ? Object.keys(entry.data).includes("description")
                              ? entry.data[
                                  "description" as keyof typeof entry.data
                                ]
                              : ""
                            : ""
                        }
                        </div>
                      </div>
                    </div>
                  </div>
                  </a>
                </div>
              `;
              })
              .join("")}
        </div>
      `;

      // Apply staggered layout after rendering
      this.applyStaggeredLayout();
    } else {
      if (DEBUG) {
        const template = `
          <span>No entries found for '${this._directory}'</span>
        `;
        this.innerHTML = template;
      } else {
        const template = `
          <!-- No Entries found for ${this._directory} -->
        `;
        this.innerHTML = template;
      }
    }
  }

  /**
   * Applies a staggered layout to the cards based on their actual column position
   */
  protected applyStaggeredLayout() {
    const container = this.querySelector(
      ".directory-index-container"
    ) as HTMLElement;
    /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */
    if (!container) return;

    // Reset all cards to no offset
    const cards = container.querySelectorAll(".directory-card");
    cards.forEach((card) => {
      (card as HTMLElement).style.transform = "";
    });

    // Wait for layout to be calculated
    setTimeout(() => {
      // Get the container width and card width to calculate columns
      const containerWidth = container.clientWidth;
      const cardWidth =
        cards.length > 0 ? (cards[0] as HTMLElement).offsetWidth : 0;

      if (cardWidth === 0) return;

      // Calculate how many cards fit in a row
      const cardsPerRow = Math.max(1, Math.floor(containerWidth / cardWidth));

      if (DEBUG) {
        console.log(
          `Container width: ${containerWidth}, Card width: ${cardWidth}, Cards per row: ${cardsPerRow}`
        );
      }

      // Get the positions of all cards
      const cardPositions = Array.from(cards).map((card) => {
        const rect = (card as HTMLElement).getBoundingClientRect();
        return {
          card: card as HTMLElement,
          left: rect.left,
          top: rect.top,
        };
      });

      // Group cards by row based on their vertical position
      const rows: HTMLElement[][] = [];
      let currentRowTop = cardPositions[0]?.top;
      let currentRow: HTMLElement[] = [];

      cardPositions.forEach(({ card, top }) => {
        // If this card is on a new row (allowing for small differences due to rounding)
        if (Math.abs(top - currentRowTop) > 5) {
          rows.push(currentRow);
          currentRow = [card];
          currentRowTop = top;
        } else {
          currentRow.push(card);
        }
      });

      // Add the last row
      if (currentRow.length > 0) {
        rows.push(currentRow);
      }

      if (DEBUG) {
        console.log(
          `Found ${rows.length} rows with cards per row: ${rows.map((r) => r.length).join(", ")}`
        );
      }

      // Process each row
      rows.forEach((rowCards) => {
        // Sort cards in this row by their horizontal position
        rowCards.sort((a, b) => {
          return (
            a.getBoundingClientRect().left - b.getBoundingClientRect().left
          );
        });

        // Apply transform based on column position within the row
        rowCards.forEach((card, columnIndex) => {
          const isEvenColumn = columnIndex % 2 === 1; // 0-indexed, so 1, 3, 5... are even columns

          if (isEvenColumn) {
            card.style.transform = "translateY(25px)";
            card.dataset.staggered = "true";
          } else {
            card.style.transform = "";
            card.dataset.staggered = "false";
          }
        });
      });
    }, 100); // Increased timeout to ensure layout is complete
  }

  /**
   * Sets up a resize observer to reapply the staggered layout when the window resizes
   */
  protected setupResizeObserver() {
    if (!this._observer) {
      this._observer = new ResizeObserver(() => {
        this.applyStaggeredLayout();
      });

      const container = this.querySelector(".directory-index-container");
      if (container) {
        this._observer.observe(container);
      }

      // Also listen for window resize events
      window.addEventListener("resize", this.handleResize);
    }
  }

  protected handleResize = () => {
    this.applyStaggeredLayout();
  };

  async connectedCallback() {
    if (DEBUG) {
      console.log(`DirectoryIndex component connected`);
    }
    this.getAttributes();

    try {
      await this.getEntries();

      if (DEBUG) {
        console.log(`After getEntries, found ${this._entries.length} entries`);
      }

      this.renderEntries();
      this.setupResizeObserver();
    } catch (error) {
      console.error(
        `Error in DirectoryIndex connectedCallback: ${String(error)}`
      );
      // Provide a fallback UI in case of error
      this.innerHTML = `<div class="error-message">Error loading directory content</div>`;
    }
  }

  disconnectedCallback() {
    // Clean up the observer when the component is removed
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }

    window.removeEventListener("resize", this.handleResize);
  }
}
customElements.define("directory-index", DirectoryIndex);
