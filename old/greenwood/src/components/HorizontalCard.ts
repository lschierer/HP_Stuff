export interface HorizontalCardProps {
  iconName: string;
  title: string;
  linkTarget?: string;
  description?: string;
}

import { type Compilation, type Route } from "../lib/greenwoodPages.ts";

import "iconify-icon";

const DEBUG = false;

async function getBody(compilation: Compilation, route: Route) {
  return `
  <horizontal-card
    link-target={linkTarget}
    icon-name={iconName}
    card-title={title}
    card-description={description}
  >
  </horizontal-card>
  `;
}

export { getBody };

// Define the behaviour for our new type of HTML element.
export default class HorizontalCard extends HTMLElement {
  private linkTarget = "";
  private iconName = "";
  private cardTitle = "";
  private description = "";

  constructor() {
    super();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (!name.localeCompare("link-target")) {
      if (DEBUG) {
        console.log(`link-target now ${newValue}`);
      }
      this.linkTarget = newValue;
    }
    if (!name.localeCompare("icon-name")) {
      if (DEBUG) {
        console.log(`iconName now ${newValue}`);
      }
      this.iconName = newValue;
    }
    if (!name.localeCompare("card-title")) {
      this.cardTitle = newValue;
    }
    if (!name.localeCompare("description")) {
      this.description = newValue;
    }
  }

  protected manualAttributeSetter = () => {
    const attributes = this.getAttributeNames();
    attributes.forEach((name) => {
      const newValue = this.getAttribute(name);
      this.attributeChangedCallback(name, "", newValue ?? "");
    });
  };

  connectedCallback() {
    let count = 0;
    if (DEBUG) {
      console.log(`Horizontalcard connectedCallback`);
    }
    this.manualAttributeSetter();

    let template = ``;

    if (this.iconName.length > 0) {
      template = `<iconify-icon
            icon=${this.iconName}
            class="not-content spectrum-Icon spectrum-Icon--sizeXXL "
            role="img"
            height="2vh"
            ></iconify-icon>`;
    }

    template = `

        <div
          class="not-content spectrum-Card spectrum-Card--horizontal"
          tabindex="0"
          role="figure"
        >
          <div class="not-content spectrum-Card-preview">
            ${template}
          </div>
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
                  >
                  ${this.description}
                  </span>

              </div>
            </div>
          </div>
        </div>
      `;

    if (this.linkTarget.length > 0) {
      template = `<a href=${this.linkTarget} class="spectrum-Card">${template}</a>`;
    }

    this.innerHTML = template;
  }
}

// Tell the browser to use our AstroHeart class for <astro-heart> elements.
customElements.define("horizontal-card", HorizontalCard);
