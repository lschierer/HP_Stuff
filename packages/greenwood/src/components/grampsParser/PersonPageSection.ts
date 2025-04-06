import debugFunction from "../../lib/debug.ts";

const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

import "./Individual.ts";

export default class PersonSection extends HTMLElement {
  accessor grampsId = "";

  protected getAttributes = () => {
    for (const attr of this.attributes) {
      if (DEBUG) {
        console.log(`attr has name ${attr.name}`);
      }
      if (!attr.name.toLowerCase().localeCompare("grampsId".toLowerCase())) {
        if (DEBUG) {
          console.log(`found personId attr with value ${attr.value}`);
        }
        this.grampsId = attr.value;
      }
    }
    if (DEBUG) {
      console.log(`looking for "${this.grampsId}"`);
    }
  };
  connectedCallback() {
    this.getAttributes();
    if (this.grampsId.length) {
      this.innerHTML = `
        <script src="/components/grampsParser/Individual.ts" type="module"></script>
        <gramps-individual
          personid="${this.grampsId}"
        ></gramps-individual>
      `;
    }
  }
}
customElements.define("person-section", PersonSection);
