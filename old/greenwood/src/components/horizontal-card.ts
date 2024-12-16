export const prerender = false;
import { LitElement, type PropertyValues, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

const DEBUG = false;

//@ts-expect-error
import SpectrumCard from "@spectrum-css/card" with { type: "css" };

@customElement("horizontal-card")
class HorizontalCard extends LitElement {
  @property({ type: String })
  public cardTitle: string = "";

  @property({ type: String })
  public targetLocation: string = "";

  @property({ type: String })
  public description: string = "";

  @property({ type: String })
  public iconName: string = "";

  @property({ type: String })
  public iconWidth: string = "";

  @property({ type: String })
  public iconHeight: string = "";

  @state()
  private _targetUrl = "";

  constructor() {
    super();
    if (this.cardTitle.length > 0) {
      const target = this.cardTitle.replaceAll(" ", "");
      this._targetUrl = `/${target}/`;
    }

    if (DEBUG) {
      console.log(
        `_targetUrl from constructor is ${this._targetUrl.toString()}`,
      );
    }
  }

  private setTargetURL(target: string) {
    if (DEBUG) {
      console.log(`HorizontalCard setTargetURL with target ${target}`);
    }
    target = target;
    if (!target.startsWith("/")) {
      target = `/${target}`;
    }
    if (!target.endsWith("/")) {
      target = `${target}/`;
    }
    if (DEBUG) {
      console.log(`target is ${target}`);
    }
    this._targetUrl = target;
  }
  protected override willUpdate(_changedProperties: PropertyValues): void {
    if (DEBUG) {
      console.log(`willupdate start`);
      console.log(
        `_changedProperties has ${Object.keys(_changedProperties).join(" ")}`,
      );
      console.log(`HorizontalCard willUpdate title is ${this.cardTitle}`);
    }
    if (_changedProperties.has("targetLocation")) {
      if (DEBUG) {
        console.log(
          `setting _targetUrl based on change in targetLocation ${this.targetLocation}`,
        );
      }
      if (this.targetLocation.length > 0) {
        this.setTargetURL(this.targetLocation);
      }
    } else if (this.targetLocation.length > this._targetUrl.length) {
      if (DEBUG) {
        console.log(
          `setting _targetUrl based on length of targetLocation ${this.targetLocation}`,
        );
      }
      this.setTargetURL(this.targetLocation);
    }
    if (_changedProperties.has("title")) {
      if (DEBUG) {
        console.log(
          `setting _targetUrl based on changed title ${this.cardTitle}`,
        );
      }
      if (
        !this._targetUrl.includes(this.targetLocation) ||
        this.targetLocation.length == 0
      ) {
        this.setTargetURL(this.cardTitle);
      } else {
        if (DEBUG) {
          console.log(
            `not setting based on title because _targetUrl ${this._targetUrl} and targetLocation ${this.targetLocation}`,
          );
          console.log(
            `targetLocation has length ${this.targetLocation.length}`,
          );
        }
      }
    } else if (this.cardTitle.length > this._targetUrl.length) {
      if (DEBUG) {
        console.log(
          `setting _targetUrl based on length of title ${this.cardTitle}`,
        );
      }
      if (
        !this._targetUrl.includes(this.targetLocation) ||
        this.targetLocation.length == 0
      ) {
        this.setTargetURL(this.cardTitle);
      } else {
        if (DEBUG) {
          console.log(
            `not setting based on title because _targetUrl ${this._targetUrl} and targetLocation ${this.targetLocation}`,
          );
          console.log(
            `targetLocation has length ${this.targetLocation.length}`,
          );
        }
      }
    }
  }

  static styles = [
    SpectrumCard,
    css`
      :host {
        /*background-color: var(--spectrum-green-500); */
      }
      .spectrum-Card-description {
        width: 20rem;
        height: fit-content;
        text-wrap: balance;
        overflow-wrap: normal;
        white-space: normal;
      }
    `,
  ];

  protected render() {
    let iconHTML = html``;
    if (this.iconName.length > 0) {
      iconHTML = html`
        <iconify-icon
          icon="${this.iconName}"
          width="${this.iconWidth || nothing}"
          height="${this.iconHeight || nothing}"
          aria-hidden="true"
          focusable="false"
          role="img"
        ></iconify-icon>
      `;
    }
    return html`
      <a href="${this._targetUrl}">
        <div
          class="spectrum-Card spectrum-Card--horizontal"
          tabindex="0"
          role="figure"
        >
          <div class="spectrum-Card-preview">${iconHTML}</div>
          <div class="spectrum-Card-body">
            <div class="spectrum-Card-header">
              <div
                class="spectrum-Card-title spectrum-Heading spectrum-Heading--sizeXS"
              >
                ${this.cardTitle}
              </div>
            </div>
            <div class="spectrum-Card-content">
              <div class="spectrum-Card-description ">
                <span class="spectrum-Card-description "
                  >${this.description}</span
                >
              </div>
            </div>
          </div>
        </div>
      </a>
    `;
  }
}

export default HorizontalCard;
