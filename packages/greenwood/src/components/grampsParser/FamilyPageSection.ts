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
  async connectedCallback() {
    this.getAttributes();
    if (this.familyName.length) {
      const fragmentHtml = await fetch(
        `/api/gramps/families/${this.familyName}/`,
        {
          method: "POST",
          body: "",
          headers: new Headers({
            "content-type": "application/x-www-form-urlencoded",
          }),
        }
      ).then((resp) => resp.text());
      const fragment = Document.parseHTMLUnsafe(fragmentHtml);
      const content = fragment.querySelector("main");
      if (content) {
        this.innerHTML = content.innerHTML;
      }
    }
  }
}
customElements.define("family-section", FamilySection);
