export const prerender = false;
import { LitElement, html, nothing, unsafeCSS } from "lit";
import type { TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { consume } from "@lit/context";

import { grampsContext, GrampsState } from "../state";

import { z } from "zod";

import * as GrampsZod from "../../../lib/GrampsZodTypes";

import { IndividualName } from "../individualName";
import { GrampsEvent } from "../events";
import { SimpleIndividual } from "../simpleIndividual";

import AncestorsTreeChartCSS from "../../../styles/AncestorsTreeChart.css?inline";

const DEBUG = false;

export class AncestorsTreeChart extends LitElement {
  @consume({ context: grampsContext })
  @state()
  private state?: GrampsState;

  @property({ type: String })
  public grampsId: string;

  @property({ type: Number })
  public maxDepth: number;

  @state()
  individual: GrampsZod.Person | null | undefined;

  constructor() {
    super();

    this.grampsId = "";
    this.maxDepth = 3;
    this.individual = null;
  }

  private renderTreeLi(
    individual: GrampsZod.Person | undefined,
    maxDepth: number,
    isRoot: boolean = false
  ): TemplateResult<1> | null {
    if (individual && this.state && this.state.zodData) {
      const db = this.state.zodData;
      if (db) {
        const family = db.families.family
          .filter((f: GrampsZod.Family) => {
            if (individual.childof) {
              const handle = f.handle;
              const iHandle = [individual.childof].flat().shift()?.hlink;
              if (iHandle) {
                return !iHandle.localeCompare(handle);
              }
            }
            return false;
          })
          .shift();
        let child: TemplateResult<1> | null = null;
        if (family) {
          const husbandRef = family.father?.hlink;
          const husband = db.people.person
            .filter((p: GrampsZod.Person) => {
              if (p.handle && husbandRef) {
                return !p.handle.localeCompare(husbandRef);
              }
              return false;
            })
            .shift();
          const wifeRef = family.mother?.hlink;
          const wife = db.people.person
            .filter((p: GrampsZod.Person) => {
              if (p.handle && wifeRef) {
                return !p.handle.localeCompare(wifeRef);
              }
              return false;
            })
            .shift();
          const currentDepth = maxDepth - 1;
          child = html`
            <ul>
              ${this.renderTreeLi(husband, currentDepth, false)}
              ${this.renderTreeLi(wife, currentDepth, false)}
            </ul>
          `;
        }
        return html`
          <li>
            ${child}
            <span>
              <individual-name
                grampsId=${individual.id}
                link=${isRoot ? nothing : true}
              />
            </span>
          </li>
        `;
      }
    }
    return null;
  }

  static styles = [unsafeCSS(AncestorsTreeChartCSS)];

  public render() {
    if (DEBUG) {
      console.log(`render; start`);
    }
    if (this.grampsId) {
      if (this.state && this.state.zodData) {
        const db = this.state.zodData;
        if (db) {
          this.individual = db.people.person
            .filter((p) => {
              return !p.id.localeCompare(this.grampsId);
            })
            .shift();

          if (this.individual) {
            return html`
              <ul class="ascending-tree">
                ${this.renderTreeLi(this.individual, this.maxDepth, true)}
              </ul>
            `;
          }
        }
      }
    }
    return html``;
  }
}
customElements.define("ancestorstree-chart", AncestorsTreeChart);

/*export function AncestorsTreeChart( individual, maxDepth }) {
    const
        return (
            <li>
                {child}
                <span>
                    <IndividualName individual={individual} noLink={isRoot} />
                </span>
            </li>
        );
    };

    return (
        <ul className="ascending-tree">
            {renderTreeLi(individual, maxDepth, true)}
        </ul>
    );
}
*/
const ancestorsTreeChartProps = z.object({
  grampsId: z.string(),
  maxDepth: z.number().default(3).optional(),
});

export type AncestorsTreeChartProps = z.infer<typeof ancestorsTreeChartProps>;
