import AncestorsTreeChartCSS from "../../../styles/AncestorsTreeChart.css" with { type: "css" };

import debugFunction from "../../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

import GrampsState from "../state.ts";
import { getGrampsData } from "../state.ts";
import "./TreeChart.ts";

export default class AncestorsTreeWrapper extends HTMLElement {
  public grampsId: string = "";
  public maxDepth: number = -1;

  protected populateLocalAttributes = () => {
    for (const attr of this.attributes) {
      if (!attr.name.toLowerCase().localeCompare("grampsId".toLowerCase())) {
        this.grampsId = attr.value;
      } else if (
        !attr.name.toLowerCase().localeCompare("maxDepth".toLowerCase())
      ) {
        this.maxDepth = Number(attr.value);
      }
    }
    if (DEBUG) {
      console.log(
        `found params grampsId: '${this.grampsId}', maxDepth: '${this.maxDepth}' `
      );
    }
  };

  async connectedCallback() {
    this.populateLocalAttributes();
    await getGrampsData(import.meta.url);
    if (DEBUG) {
      console.log(
        `AncestorsTree has `,
        `${GrampsState.people.length} people `,
        `${GrampsState.families.length} families `
      );
    }
    this.attachShadow({ mode: "open" });
    if (this.shadowRoot) {
      this.shadowRoot.adoptedStyleSheets.push(AncestorsTreeChartCSS);
      this.shadowRoot.innerHTML = `
          <ancestors-treechart isRoot grampsId=${this.grampsId} maxDepth=${this.maxDepth} ></ancestors-treechart>
      `;
    }
  }
}
customElements.define("ancestors-tree", AncestorsTreeWrapper);
