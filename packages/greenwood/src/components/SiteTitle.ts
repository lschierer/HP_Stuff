import debugFunction from "../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}
import SiteTitleCSS from "../styles/SiteTitle.css" with { type: "css" };
import GlobalCSS from "../styles/global.css" with { type: "css" };

export default class SiteTitle extends HTMLElement {
  protected logo = "/assets/LukeHPSite.svg";
  protected siteTitle = "";
  protected altText = "Luke's HP Site";

  connectedCallback() {
    this.attachShadow({ mode: "open" });

    const template = document.createElement("template");
    template.innerHTML = `
        <span class="spectrum-Heading spectrum-Heading--sizeXXXL">
          <a href='/' class="site-title ">
            <img
              alt=${this.altText}
              src=${this.logo}
              />

            <span class="siteTitle spectrum-Heading spectrum-Heading--sizeXXXL">
              ${this.siteTitle}
            </span>
          </a>
        </span>
    `;
    this.shadowRoot?.appendChild(template.content.cloneNode(true));
    this.shadowRoot?.adoptedStyleSheets.push(GlobalCSS);
    if (DEBUG) {
      console.log(
        `styles currently ${(GlobalCSS).cssRules.length}`
      );
    }
    this.shadowRoot?.adoptedStyleSheets.push(SiteTitleCSS);
  }
}
customElements.define("site-title", SiteTitle);
