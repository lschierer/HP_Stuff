export const prerender = false;
import { html, css, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { TopLevelSections } from "../lib/topLevelSections.ts";

const DEBUG = 0;

@customElement("top-nav")
export default class TopNav extends LitElement {
  @property({ type: String })
  public logoLocation: string = "";

  static localStyle = css`
    :host {
      display: block;
      width: 100vw;
      margin-bottom: 2rem;
    }

    .header {
      background-color: var(--spectrum-blue-200);
      min-height: 30px;
      padding: 10px;
      font-size: 1.2rem;
      width: 100;
    }

    .head-wrap {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
    }

    .brand {
      justify-items: left;
      padding: 10px;
    }

    .brand img {
      float: left;
      height: 3rem;
      width: 100;
    }

    .header .social {
      margin-left: auto;
      text-align: right;
      padding: 2rem;
    }

    .nav {
      margin-left: 5rem;
      width: 100;
      height: 100;
      flex-grow: 4;
      display: flex;
      justify-items: stretch;
      align-content: space-evenly;
      flex-wrap: wrap;
    }

    .nav-item {
      height: 100;
      flex-grow: 1;
      flex-shrink: 1;
    }
  `;

  static styles =
    super.styles !== undefined && Array.isArray(super.styles)
      ? [...super.styles, TopNav.localStyle]
      : [TopNav.localStyle];

  protected render() {
    if (DEBUG) {
      console.log(`TopNav render start`);
    }
    const sections = TopLevelSections.options;

    return html`
      <header class="header">
        <div class="head-wrap">
          <div class="brand">
            <a href="/" alt="Home">
              <img src="/assets/LukeHPSite.svg" alt="Luke's HP Site" />
            </a>
          </div>
          <div class="nav">
            ${sections.map((section: TopLevelSections) => {
              return html`
                <div class="nav-item">
                  <a href="/${section.replaceAll(" ", "")}/">
                    <span>${section}</span>
                  </a>
                </div>
              `;
            })}
          </div>
          <div class="social">
            <a href="https://github.com/lschierer/HP_Stuff">
              <iconify-icon
                icon="mdi:github"
                width="2rem"
                height="2rem"
              ></iconify-icon>
            </a>
          </div>
        </div>
      </header>
    `;
  }
}
