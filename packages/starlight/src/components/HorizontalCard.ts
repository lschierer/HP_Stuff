import "iconify-icon";
import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

const DEBUG = false;

export default class HorizontalCard extends LitElement {
  @property()
  public linkTarget = "";

  @property()
  public iconName = "";

  @property()
  public cardTitle = "";

  @property()
  public cardDescription = "";

  constructor() {
    super();
  }
  protected createRenderRoot() {
    return this;
  }

  protected render() {
    let template = html``;
    if (this.iconName.length > 0) {
      template = html`<iconify-icon
        icon=${this.iconName}
        class="not-content spectrum-Icon spectrum-Icon--sizeXXL "
        role="img"
        height="2vh"
      ></iconify-icon>`;
    }
    return html`
      <a
        href="${this.linkTarget ?? ""}"
        class="spectrum-Link spectrum-Link--quiet spectrum-Link--secondary"
      >
        <div
          class="not-content spectrum-Card spectrum-Card--horizontal"
          tabindex="0"
          role="figure"
        >
          <div class="not-content spectrum-Card-preview">${template}</div>
          <div class="not-content spectrum-Card-body">
            <div class="not-content spectrum-Card-header">
              <div
                class="not-content spectrum-Card-title spectrum-Heading spectrum-Heading--sizeXS"
              >
                ${this.cardTitle}
              </div>
            </div>
            <div class="not-content spectrum-Card-content">
              <div class="not-content spectrum-Card-description ">
                <span class="not-content spectrum-Card-description "
                  >${unsafeHTML(this.cardDescription)}</span
                >
                <slot><span> </span></slot>
              </div>
            </div>
          </div>
        </div>
      </a>
    `;
  }
}

// Tell the browser to use our AstroHeart class for <astro-heart> elements.
customElements.define("horizontal-card", HorizontalCard);
