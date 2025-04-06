import debugFunction from "../../lib/debug.ts";

const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

import "./FamilyListing.ts";

export default class FamilySection extends HTMLElement {
  accessor familyName = "";

  protected getAttributes = () => {
    for (const attr of this.attributes) {
      if (DEBUG) {
        console.log(`attr has name ${attr.name}`);
      }
      if (!attr.name.toLowerCase().localeCompare("familyName".toLowerCase())) {
        if (DEBUG) {
          console.log(`found familyName attr with value ${attr.value}`);
        }
        this.familyName = attr.value;
      }
    }
    if (DEBUG) {
      console.log(`looking for "${this.familyName}"`);
    }
  };
  connectedCallback() {
    this.getAttributes();
    if (this.familyName.length) {
      this.innerHTML = `
        <script type="module" src="/components/grampsParser/FamilyListing.ts"></script>
        <family-listing
          familyname="${this.familyName}"
          showHeading
        ></family-listing>
      `;
    }
  }
}
customElements.define("family-section", FamilySection);
