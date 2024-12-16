import { LitElement, css, unsafeCSS } from "lit";

import style from "../styles/tailwind.css?inline";

import "iconify-icon";

const tailwindElement = unsafeCSS(style);

type Constructor<T = {}> = new (...args: any[]) => T;
export const TailwindMixin = <T extends Constructor<LitElement>>(
  superClass: T,
  style: string,
) =>
  class extends LitElement {
    constructor() {
      super();
    }

    connectedCallback() {
      super.connectedCallback();
      // @ts-ignore
    }

    static styles = [tailwindElement, unsafeCSS(style)];
  };
