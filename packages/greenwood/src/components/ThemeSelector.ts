import debugFunction from "../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

import { ChangeTheme, ThemeSelection, getTheme } from "./Spectrum/Base.ts";

export default class ThemeSelector extends HTMLElement {
  private option = getTheme();

  protected ThemeChangedCallback = (e: Event) => {
    const target = (e as CustomEvent).target as HTMLSelectElement | null;
    if (target) {
      const value = target.value;
      if (DEBUG) {
        console.log(`ThemeChangedCallback detects value ${value}`);
      }
      if (value) {
        const valid = ThemeSelection.safeParse(value);
        if (valid.success) {
          ChangeTheme(valid.data);
          this.option = valid.data;
        } else {
          if (DEBUG) {
            console.log(
              `error getting value in ThemeChangedCallback`,
              valid.error.message
            );
          }
        }
      }
    }
  };

  connectedCallback() {
    if (DEBUG) {
      console.log(`this.option is ${this.option}`);
    }
    
    // Apply the theme immediately when component connects
    ChangeTheme(this.option);
    
    this.innerHTML = `
     <select
        class="spectrum-Picker spectrum-Picker--sizeM"
        id="ThemeSelector"
        value="${this.option}"
        width="6.25em"
     >
      <option
        value="light"
        class="spectrum-Menu-item"
        ${this.option === "light" ? "selected" : ""}
      >
        light
      </option>
      <option
        value="dark"
        class="spectrum-Menu-item"
        ${this.option === "dark" ? "selected" : ""}
      >
        dark
      </option>
      <option
        value="auto"
        class="spectrum-Menu-item"
        ${this.option === "auto" ? "selected" : ""}
      >
        auto
      </option>
     </select>
    `;
    const select = this.querySelector("#ThemeSelector");
    if (select) {
      select.addEventListener("change", this.ThemeChangedCallback);
    } else {
      if (DEBUG) {
        console.log(`cannot find select in template`);
      }
    }
  }
}
customElements.define("theme-select", ThemeSelector);
