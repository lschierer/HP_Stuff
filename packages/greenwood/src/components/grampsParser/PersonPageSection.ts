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
  async connectedCallback() {
    this.getAttributes();
    if (this.grampsId.length) {
      const fragmentHtml = await fetch(`/api/gramps/people/${this.grampsId}`, {
        method: "POST",
        body: "",
        headers: new Headers({
          "content-type": "application/x-www-form-urlencoded",
        }),
      }).then((resp) => resp.text());
      const fragment = Document.parseHTMLUnsafe(fragmentHtml);
      const content = fragment.querySelector("main");
      if (content) {
        this.innerHTML = content.innerHTML;
      }
    }
  }
}
customElements.define("person-section", PersonSection);
