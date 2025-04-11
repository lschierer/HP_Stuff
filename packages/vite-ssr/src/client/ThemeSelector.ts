import debugFunction from "@shared/debug";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

// src/client/ThemeSelector.ts
import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ChangeTheme, getTheme } from "./theme";

@customElement("theme-select")
export class ThemeSelector extends LitElement {
  @property({ type: String })
  value = getTheme();

  @property({ type: String })
  label = "Theme";

  static styles = css`
    /* Your styles here */
  `;

  connectedCallback() {
    super.connectedCallback();
    // Apply the theme when the component is connected
    ChangeTheme(this.value === "light" ? "light" : "dark");
  }

  // Use an arrow function to avoid the unbound method issue
  private handleChange = (e: Event) => {
    const select = e.target as HTMLSelectElement;
    this.value = select.value;
    ChangeTheme(this.value === "light" ? "light" : "dark");
  };

  render() {
    return html`
      <select
        class="spectrum-Picker spectrum-Picker--sizeM"
        id="ThemeSelector"
        label="${this.label}"
        value="${this.value}"
        @change="${this.handleChange}"
        width="6.25em"
      >
        <option value="dark" class="spectrum-Menu-item">dark</option>
        <option value="light" class="spectrum-Menu-item">light</option>
        <option value="auto" class="spectrum-Menu-item" selected>auto</option>
      </select>
    `;
  }
}
