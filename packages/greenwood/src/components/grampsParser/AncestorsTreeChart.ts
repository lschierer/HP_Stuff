import { z } from "zod";
import * as d3 from "d3";
import AncestorsTreeChartCSS from "../../../styles/AncestorsTreeChart.css" with { type: "css" };

import "./IndividualName.ts";
import { StringEnum as PersonStrings } from "../../schemas/gedcom/person.ts";
import { StringEnum as FamilyStrings } from "../../schemas/gedcom/family.ts";

import { type GedcomPerson } from "../../schemas/gedcom/index.ts";

import debugFunction from "../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

import GrampsState from "./state.ts";
import { getGrampsData } from "./state.ts";

export default class AncestorsTreeWrapper extends HTMLElement {
  public grampsId: string = "";
  public maxDepth: number = -1;

  protected populateLocalAttributes = () => {
    for (const attr of this.attributes) {
      if (!attr.name.toLowerCase().localeCompare("grampsId".toLowerCase())) {
        this.grampsId = attr.value;
      } else if (
        !attr.name.toLowerCase().localeCompare("maxDepth".toLowerCase())
      ) {
        this.maxDepth = Number(attr.value);
      }
    }
    if (DEBUG) {
      console.log(
        `found params grampsId: '${this.grampsId}', maxDepth: '${this.maxDepth}' `
      );
    }
  };

  async connectedCallback() {
    this.populateLocalAttributes();
    await getGrampsData(import.meta.url);
    if (DEBUG) {
      console.log(
        `AncestorsTree has `,
        `${GrampsState.people.length} people `,
        `${GrampsState.families.length} families `
      );
    }
    this.attachShadow({ mode: "open" });
    if (this.shadowRoot) {
      this.shadowRoot.adoptedStyleSheets.push(AncestorsTreeChartCSS);
      this.shadowRoot.innerHTML = `
          ${DEBUG ? `<span>AncestorsTreeWrapper</span><br/>` : ""}
          <ancestors-treechart isRoot grampsId=${this.grampsId} maxDepth=${this.maxDepth} ></ancestors-treechart>
      `;
    }
  }
}
customElements.define("ancestors-tree", AncestorsTreeWrapper);

class AncestorsTreeChart extends HTMLElement {
  public grampsId: string = "";
  public isRoot: boolean = false;
  public maxDepth: number = -1;

  private generations: number = this.maxDepth != -1 ? this.maxDepth : 2;
  private treeData: object | undefined = undefined;
  private PresentInTree = new Set<string>();

  protected populateLocalAttributes = () => {
    for (const attr of this.attributes) {
      if (!attr.name.toLowerCase().localeCompare("grampsId".toLowerCase())) {
        this.grampsId = attr.value;
      } else if (
        !attr.name.toLowerCase().localeCompare("isRoot".toLowerCase())
      ) {
        this.isRoot = true;
      } else if (
        !attr.name.toLowerCase().localeCompare("maxDepth".toLowerCase())
      ) {
        this.maxDepth = Number(attr.value);
        this.generations = this.maxDepth != -1 ? this.maxDepth : 2;
      }
    }
  };

  protected nameForPerson = (
    person: GedcomPerson.GedcomElement,
    withoutNick: boolean = false
  ) => {
    let name = "";
    name = person.primary_name.first_name;
    if (!withoutNick && person.primary_name.nick) {
      name.concat(` (${person.primary_name.nick})`);
    }
    let lastName = person.primary_name.surname_list.find((sn) => {
      return !sn.origintype.string.localeCompare(
        PersonStrings.Enum["Birth Name"]
      );
    });
    if (!lastName) {
      lastName = person.primary_name.surname_list.find((sn) => {
        return !sn.origintype.string.localeCompare(PersonStrings.Enum["Given"]);
      });
    }
    if (!lastName) {
      lastName = person.primary_name.surname_list.find((sn) => {
        return sn.primary;
      });
    }
    if (!lastName) {
      lastName = person.primary_name.surname_list[0];
    }
    if (lastName.surname.length) {
      if (DEBUG) {
        console.log(`found lastname ${lastName.surname} for ${person.id}`);
      }
      name.concat(` ${lastName.surname}`);
    }
    if (person.primary_name.suffix) {
      name.concat(` ${person.primary_name.suffix}`);
    }
    return name;
  };

  protected addToTree = (
    localRoot: GedcomPerson.GedcomElement | undefined
  ): object | undefined => {
    if (localRoot == undefined) {
      return;
    }
    if (!this.PresentInTree.has(localRoot.id)) {
      const father = GrampsState.people.find((p) => {
        const family = GrampsState.families.find((f) => {
          if (p.family_list.includes(f.handle)) {
            const cf = f.child_ref_list.find((c) => {
              return !c.ref.localeCompare(p.handle);
            });
            if (cf) {
              if (!cf.frel.string.localeCompare(FamilyStrings.Enum.Birth)) {
                return true;
              }
              if (!cf.mrel.string.localeCompare(FamilyStrings.Enum.Birth)) {
                return true;
              }
            }
          }
          return false;
        });
        if (family && family.father_handle) {
          const fHandle = family.father_handle;
          return GrampsState.people.find((p2) => {
            return !p2.handle.localeCompare(fHandle);
          });
        }
        return false;
      });
      const mother = GrampsState.people.find((p) => {
        const family = GrampsState.families.find((f) => {
          if (p.family_list.includes(f.handle)) {
            const cf = f.child_ref_list.find((c) => {
              return !c.ref.localeCompare(p.handle);
            });
            if (cf) {
              if (!cf.frel.string.localeCompare(FamilyStrings.Enum.Birth)) {
                return true;
              }
              if (!cf.mrel.string.localeCompare(FamilyStrings.Enum.Birth)) {
                return true;
              }
            }
          }
          return false;
        });
        if (family && family.mother_handle) {
          const mHandle = family.mother_handle;
          return GrampsState.people.find((p2) => {
            return !p2.handle.localeCompare(mHandle);
          });
        }
        return false;
      });
      this.PresentInTree.add(localRoot.id);
      return {
        name: this.nameForPerson(localRoot),
        children: [this.addToTree(father), this.addToTree(mother)],
      };
    } else {
      return;
    }
  };

  protected treeSetup = () => {
    const rootPerson = GrampsState.people.find((p) => {
      return !p.id.localeCompare(this.grampsId);
    });
    if (!rootPerson) {
      if (DEBUG) {
        console.error(`failed to find root person for ${this.grampsId}`);
      }
      return;
    } else {
      this.treeData = this.addToTree(rootPerson);
    }
  };

  connectedCallback() {
    this.populateLocalAttributes();
    this.innerHTML = `
      ${DEBUG ? `<span>AncestorsTreeChart</span><br/>` : ""}
      <div id='graph'>
        <span>test Text</span>
        <svg width="400px" height="400px">
                <g transform="translate(5, 50)">
                    <g class="links"></g>
                    <g class="nodes"></g>
                </g>
            </svg>
      </div>
      `;

    const treeLayout = d3.tree().size([400, 200]);
    if (this.treeData) {
      const root = d3.hierarchy(this.treeData as unknown);
      treeLayout(root);
      d3.select("svg g.nodes")
        .selectAll("circle.node")
        .data(root.descendants())
        .join("circle")
        .classed("node", true)
        .attr("cx", function (d) {
          return d.x;
        })
        .attr("cy", function (d) {
          return d.y;
        })
        .attr("r", 10);

      d3.select("svg g.links")
        .selectAll("line.link")
        .data(root.links())
        .join("line")
        .classed("link", true)
        .style("stroke", "black")
        .attr("x1", function (d) {
          return d.source.x;
        })
        .attr("y1", function (d) {
          return d.source.y;
        })
        .attr("x2", function (d) {
          return d.target.x;
        })
        .attr("y2", function (d) {
          return d.target.y;
        });
    }
  }
}
customElements.define("ancestors-treechart", AncestorsTreeChart);
