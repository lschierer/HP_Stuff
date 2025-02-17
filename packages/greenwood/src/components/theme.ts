import { z } from "zod";

import { type Theme as SPTheme } from "@spectrum-web-components/theme";

import debugFunction from "../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

const Theme = z.union([z.literal("light"), z.literal("dark")]);
type Theme = z.infer<typeof Theme>;

const ThemeSelection = z.union([Theme, z.literal("auto")]);
type ThemeSelection = z.infer<typeof ThemeSelection>;

export default class ThemeComponent extends HTMLElement {
  private storedTheme: Theme = "light";

  public updatePickers = (theme: ThemeSelection = "auto") => {
    if (theme === "auto") {
      theme = this.storedTheme;
    }
    document.querySelectorAll("theme-select").forEach((picker) => {
      const select = picker.querySelector("select");
      if (select) {
        select.value = theme;
      }
      const tmpl: HTMLTemplateElement | null =
        document.querySelector("#theme-icons");
      const newIcon = tmpl && tmpl.content.querySelector("." + theme);
      if (newIcon) {
        const oldIcon = picker.querySelector("svg.label-icon");
        if (oldIcon) {
          oldIcon.replaceChildren(...newIcon.cloneNode(true).childNodes);
        }
      }
    });
  };

  private ThemeProvider = () => {
    const storedTheme =
      typeof localStorage !== "undefined" &&
      localStorage.getItem("hpfansite-theme");
    const theme =
      storedTheme ||
      (window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark");
    document.documentElement.dataset.theme =
      theme === "light" ? "light" : "dark";
  };
  connectedCallback() {
    if (DEBUG) {
      console.log(`connectedCallback for ThemeComponent`);
    }
    this.ThemeProvider();
    if (
      !this.storedTheme.localeCompare("light") ||
      !this.storedTheme.localeCompare("dark")
    ) {
      const scale = "medium";
      document.querySelectorAll("sp-theme").forEach((sptheme) => {
        void Promise.all([
          import(
            `/node_modules/@spectrum-web-components/theme/theme-${this.storedTheme}.js`
          ),
          import(
            `/node_modules/@spectrum-web-components/theme/scale-${scale}.js`
          ),
        ]).then(() => {
          (sptheme as SPTheme).color = this.storedTheme;
          (sptheme as SPTheme).scale = scale;
        });
      });
      document.querySelectorAll("html").forEach((html) => {
        if (!html.classList.contains("spectrum")) {
          html.classList.add("spectrum");
        }
        if (!html.classList.contains(this.storedTheme)) {
          if (!this.storedTheme.localeCompare("light")) {
            html.classList.add("spectrum--light");
            html.classList.remove("spectrum--dark");
          } else {
            html.classList.remove("spectrum--light");
            html.classList.add("spectrum--dark");
          }
        }
        if (!html.classList.contains(scale)) {
          html.classList.add(scale);
        }
      });
    }
  }
}
customElements.define("theme-component", ThemeComponent);
