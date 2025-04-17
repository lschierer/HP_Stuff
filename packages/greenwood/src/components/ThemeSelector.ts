import debugFunction from "../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

// src/client/ThemeSelector.ts
import { ChangeTheme, getTheme } from "./Spectrum/Base.ts";

export class ThemeSelector extends HTMLElement {
  private value = getTheme();

  private label = "Theme";

  connectedCallback() {
    // Apply the theme when the component is connected
    ChangeTheme(this.value === "light" ? "light" : "dark");
    const select = this.querySelector("#ThemeSelector");
    this.innerHTML = this.render();
    if (select) {
      select.addEventListener("change", this.handleChange);
    } else {
      if (DEBUG) {
        console.log(`cannot find select in template`);
      }
    }
  }

  // Use an arrow function to avoid the unbound method issue
  private handleChange = (e: Event) => {
    const select = e.target as HTMLSelectElement;
    this.value = select.value;
    ChangeTheme(this.value === "light" ? "light" : "dark");
  };

  render() {
    return `
      <select
        class="spectrum-Picker spectrum-Picker--sizeM"
        id="ThemeSelector"
        label="${this.label}"
        value="${this.value}"
        width="6.25em"
      >
        <option value="dark" class="spectrum-Menu-item">dark</option>
        <option value="light" class="spectrum-Menu-item">light</option>
        <option value="auto" class="spectrum-Menu-item" selected>auto</option>
      </select>
    `;
  }
}
customElements.define("theme-select", ThemeSelector);
