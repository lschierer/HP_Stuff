export const prerender = false;
import { type TemplateResult, css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

//@ts-expect-error
import { getContentByCollection } from "@greenwood/cli/src/data/client.js";

import { CardGrid } from "./card-grid.ts";

import { type Page, sortPages } from "../lib/greenwoodPages.ts";
import type { PropertyValues } from "lit";
import { type CardDetails } from "./card-grid.ts";

const DEBUG = false;

@customElement("collection-cardgrid")
export default class ColletionCardGrid extends CardGrid {
  @property({ type: String, reflect: true })
  public collection: String = "";

  constructor() {
    super();
  }

  protected async willUpdate(_changedProperties: PropertyValues) {
    if (DEBUG) {
      console.log(`ColletionCardGrid willUpdate start`);
    }
    super.willUpdate(_changedProperties);
    if (_changedProperties.has("collection")) {
      if (DEBUG) {
        console.log(
          `ColletionCardGrid willUpdate has _changedProperties collection`,
        );
      }
      await this.updateSections();
    }
  }

  private async updateSections() {
    if (DEBUG) {
      console.log(`ColletionCardGrid updateSections start`);
    }
    if (this.collection.length > 0) {
      if (DEBUG) {
        console.log(
          `ColletionCardGrid updateSections has collection '${this.collection}'`,
        );
      }
      this.gridCards = new Array<CardDetails>();
      if (DEBUG) {
        console.log(
          `after new, this.gridCards has length ${this.gridCards.length}`,
        );
      }

      const routes = new Array<String>();
      await getContentByCollection(this.collection).then((pages: Page[]) =>
        pages
          .sort((a: Page, b: Page) => sortPages(a, b))
          .map((page: Page) => {
            if (page === undefined) {
              console.warn(
                `found undefined page in collection '${this.collection}'`,
              );
            } else {
              if (DEBUG) {
                //console.log(`page data structure '${JSON.stringify(page)}`);
                console.log(
                  `card with title ${page.title}, route ${page.route}`,
                );
              }
              if (!routes.includes(page.route)) {
                routes.push(page.route);
                (this.gridCards as Array<CardDetails>).push({
                  title: (page.title as string) ?? page.label.replace("-", " "),
                  target: page.route as string,
                  description: (page.data!.description as string) ?? "",
                  name: "dashicons:text-page",
                });
                if (DEBUG) {
                  console.log(`routes is now ${routes.join("; ")}`);
                }
              } else {
                if (DEBUG) {
                  console.log(`skipping push because route already present`);
                }
              }
            }
          }),
      );
      if (DEBUG) {
        console.log(
          `after await this.gridCards now has length ${this.gridCards.length} routes is now ${routes.length}`,
        );
      }
      this.requestUpdate("gridCards");
    } else {
      if (DEBUG) {
        console.log(
          `collection is undefined in ColletionCardGrid updateSections`,
        );
      }
    }
  }

  async connectedCallback() {
    if (DEBUG) {
      console.log(`ColletionCardGrid connectedCallback start`);
    }
    super.connectedCallback();
  }

  static localStyles = css`
    :host {
      height: 60vh;
      display: block;
    }
    .cardGrid {
      height: 100%;
      width: 100%;
      display: flex;

      flex-direction: row;
      flex-wrap: wrap;
      margin-top: 2rem;
    }

    .cardGrid1,
    .cardGrid2 {
      height: 100%;
      width: max-content;
      display: flex;
      flex-direction: column;
      flex: 1 0 auto;
    }
    .cardGrid1 {
      justify-content: space-between;
    }

    .cardGrid2 {
      justify-content: space-evenly;
    }

    horizontal-card {
      width: max-content;
      height: max-content;
    }
  `;
  static styles = [...super.styles, ColletionCardGrid.localStyles];

  protected render() {
    if (DEBUG) {
      console.log(`CardGrid render start`);
    }
    const cardTemplates1 = new Array<TemplateResult>();
    const cardTemplates2 = new Array<TemplateResult>();
    if (Array.isArray(this.gridCards) && this.gridCards.length > 0) {
      this.gridCards.map((page, index) => {
        const pick = index % 2;
        if (DEBUG) {
          console.log(`pick '${pick} for index ${index} card ${page.title}`);
        }
        if (!pick) {
          cardTemplates1.push(html`
            <horizontal-card
              cardTitle="${page.title}"
              iconName="${page.name}"
              iconHeight="1.2rem"
              iconWidth="1.2rem"
              description="${page.description ?? nothing}"
              targetLocation=${page.target ?? nothing}
            ></horizontal-card>
          `);
        } else {
          cardTemplates2.push(html`
            <horizontal-card
              cardTitle="${page.title}"
              iconName="${page.name}"
              iconHeight="1.2rem"
              iconWidth="1.2rem"
              description="${page.description ?? nothing}"
              targetLocation=${page.target ?? nothing}
            ></horizontal-card>
          `);
        }
      });
    }

    return html`
      <div class="cardGrid" role="grid">
        <div class="cardGrid1">${cardTemplates1}</div>
        <div class="cardGrid2">${cardTemplates2}</div>
      </div>
    `;
  }
}
