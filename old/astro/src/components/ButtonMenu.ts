import { LitElement, html, css, unsafeCSS, nothing } from "lit";
import type { PropertyValues, TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { TailwindMixin } from "./tailwind.element";

import { z } from "zod";

import style from "../styles/ButtonMenu.css?inline";

export class ButtonMenu extends TailwindMixin(LitElement, style) {
  constructor() {
    super();
  }

  private buttonClasses = {
    "items-center": true,
    "rounded-full": true,
    "bg-transparent": true,
    "hover:bg-lochmara-600": true,
    "focus:outline-none": true,
    "ring-2": true,
    "focus:ring-indigo-500": true,
    "focus:ring-offset-2": true,
    "focus:ring-offset-gray-100": true,
    "space-x-1": true,
  };

  render() {
    const t = html`
      <div class="relative inline-block text-left">
        <div>
          <button
            type="button"
            class="flex ${classMap(this.buttonClasses)}"
            id="menu-button"
            aria-expanded="true"
            aria-haspopup="true"
          >
            <iconify-icon icon="uil:ellipsis-v"></iconify-icon>
            <iconify-icon icon="mdi:caret-down-outline"></iconify-icon>
          </button>
        </div>
      </div>
    `;

    return html`${t}`;
  }
}
customElements.define("button-menu", ButtonMenu);
