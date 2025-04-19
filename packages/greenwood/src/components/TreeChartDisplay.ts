import SpectrumCSSTokens from "@spectrum-css/tokens/dist/index.css" with { type: "css" };
import GrampsCSS from "../styles/Gramps.css" with { type: "css" };
import AncestorsTreeChart from "../styles/AncestorsTreeChart.css" with { type: "css" };

export default class TreeChartDispaly extends HTMLElement {
  private _svgPath: string = "";

  protected getAttributes = () => {
    for (const attr of this.attributes) {
      console.log(`attribute is ${attr.name}`);
      if (!attr.name.toLowerCase().localeCompare("svgPath".toLowerCase())) {
        console.log(`found svgPath attribute`);
        this._svgPath = attr.value;
        if (this._svgPath.startsWith("<")) {
          this._svgPath = this._svgPath.slice(1, -1);
        }
      }
    }
  };

  async connectedCallback() {
    this.getAttributes();

    document.adoptedStyleSheets.push(SpectrumCSSTokens);
    document.adoptedStyleSheets.push(GrampsCSS);
    document.adoptedStyleSheets.push(AncestorsTreeChart);
    const svgResponse = await fetch(this._svgPath);
    if (svgResponse.ok) {
      const svg = await svgResponse.text();
      this.innerHTML = `
        <div class="TimelineCard rounded border-2">
          <div id="familyTree" class="svg-container">
            ${svg}
          </div>
        </div>
      `;
    }
  }
}
customElements.define("tree-chart", TreeChartDispaly);
