export const prerender = false;
import {
  html,
  LitElement,
  css,
  type TemplateResult,
  type PropertyValues,
} from "lit";
import { customElement, property } from "lit/decorators.js";

const DEBUG = false;

import { type CardDetails as CardDetail } from "../lib/CardDetails";
export type CardDetails = CardDetail;

//@ts-expect-error unused import
import { HorizontalCard } from "./horizontal-card";

@customElement("card-grid")
export class CardGrid extends LitElement {
  @property({ reflect: true })
  public gridCards: CardDetails[] | string = new Array<CardDetails>();

  static localStyles = css`
    .cardGrid {
      display: flex;
      flex-wrap: wrap;
      flex-shrink: 0;
      gap: 2rem;
    }
  `;

  static override styles = [CardGrid.localStyles];

  protected override willUpdate(_changedProperties: PropertyValues): void {
    super.willUpdate(_changedProperties);
    if (
      _changedProperties.has("gridCards") ||
      _changedProperties.has("gridcards")
    ) {
      if (!Array.isArray(this.gridCards)) {
        console.log(`gridcards are ${this.gridCards}`);
        const data: CardDetail[] = JSON.parse(
          decodeURIComponent(this.gridCards),
        );
        if (Array.isArray(data)) {
          this.gridCards = data;
        }
      }
    }
  }

  protected override render() {
    if (DEBUG) {
      console.log(`CardGrid render start`);
    }
    const cardTemplates = new Array<TemplateResult>();
    if (Array.isArray(this.gridCards) && this.gridCards.length > 0) {
      this.gridCards.map((section) => {
        cardTemplates.push(html`
          <horizontal-card
            cardTitle="${section.title}"
            iconName="${section.name}"
            iconHeight="1.2rem"
            iconWidth="1.2rem"
            description="${section.description ?? ""}"
            targetLocation=${section.target ?? ""}
          ></horizontal-card>
        `);
      });
    }

    return html` <div class="cardGrid" role="grid">${cardTemplates}</div> `;
  }
}
