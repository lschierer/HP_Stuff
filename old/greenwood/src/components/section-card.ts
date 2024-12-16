export const prerender = false;
import { LitElement, type PropertyValues, css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

const DEBUG = 1;

//@ts-expect-error
import SpectrumCard from "@spectrum-css/card" with { type: "css" };

//@ts-expect-error
import SpectrumTypography from "@spectrum-css/typography" with { type: "css" };

@customElement("section-card")
class SectionCard extends LitElement {
  @property({ type: String })
  public cardTitle: string = "";

  @property({ type: String })
  public description: string = "";

  @property({ type: String })
  public iconName: string = "";

  @property({ type: String })
  public iconWidth: string = "";

  @property({ type: String })
  public iconHeight: string = "";

  constructor() {
    super();
  }

  protected override willUpdate(_changedProperties: PropertyValues): void {
    if (DEBUG) {
      console.log(`willupdate start`);
      console.log(
        `_changedProperties has ${Object.keys(_changedProperties).join(" ")}`,
      );
      console.log(`title is ${this.cardTitle}`);
    }

    if (_changedProperties.has("title")) {
      if (DEBUG) {
        console.log(
          `setting _targetUrl based on changed title ${this.cardTitle}`,
        );
      }
    }
  }

  static styles = [
    SpectrumTypography,
    SpectrumCard,
    css`
      :host {
        /*background-color: var(--spectrum-green-500); */
      }
      .spectrum-Card-description {
        width: 20rem;
        height: fit-content;
        text-wrap: balance;
        overflow-wrap: normal;
        white-space: normal;
      }
    `,
  ];

  protected render() {
    let iconHTML = html``;
    if (this.iconName.length > 0) {
      iconHTML = html`
        <iconify-icon
          icon="${this.iconName}"
          width="${this.iconWidth || nothing}"
          height="${this.iconHeight || nothing}"
          aria-hidden="true"
          focusable="false"
          role="img"
        ></iconify-icon>
      `;
    }
    return html`
      <div
        class="spectrum-Card spectrum-Card--section"
        tabindex="0"
        role="figure"
      >
        <div class="spectrum-Card-preview">${iconHTML}</div>
        <div class="spectrum-Card-body">
          <div class="spectrum-Card-header">
            <div
              class="spectrum-Card-title spectrum-Heading spectrum-Heading--sizeXS"
            >
              ${this.cardTitle}
            </div>
          </div>
          <div class="spectrum-Card-content">
            <div class="spectrum-Card-description ">
              <span class="spectrum-Card-description "
                >${this.description}</span
              >
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

export default SectionCard;
