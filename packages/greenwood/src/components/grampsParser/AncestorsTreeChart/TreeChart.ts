import { type GedcomPerson } from "../../../schemas/gedcom/index.ts";

import "../IndividualName.ts";

import GrampsState from "../state.ts";
import { findFatherForChild, findMotherForChild } from "../state.ts";

import { type TreePerson } from "./TreePerson.ts";
import IndividualName from "../IndividualName.ts";

import debugFunction from "../../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

import drawTree from "./DotChart.ts";

export default class AncestorsTreeChart extends HTMLElement {
  public grampsId: string = "";
  public isRoot: boolean = false;
  public maxDepth: number = -1;

  private extended_family = new Map<string, TreePerson>();

  protected populateLocalAttributes = () => {
    for (const attr of this.attributes) {
      if (!attr.name.toLowerCase().localeCompare("grampsId".toLowerCase())) {
        this.grampsId = attr.value;
      } else if (
        !attr.name.toLowerCase().localeCompare("maxDepth".toLowerCase())
      ) {
        this.maxDepth = Number(attr.value);
      } else if (
        !attr.name.toLowerCase().localeCompare("isRoot".toLowerCase())
      ) {
        this.isRoot = true;
      }
    }
    if (DEBUG) {
      console.log(
        `found params grampsId: '${this.grampsId}', maxDepth: '${this.maxDepth}', isRoot: ${this.isRoot}`
      );
    }
  };

  buildGenerationTable = (root: TreePerson) => {
    // 2. root is already found and passed to this function.

    // 3. Use a breadth-first search (BFS) to determine generations
    const generations: TreePerson[][] = new Array<Array<TreePerson>>();
    const queue: TreePerson[] = [{ ...root, generation: 0 }];
    const ine = new IndividualName();

    while (queue.length > 0) {
      const person = queue.shift();

      // Initialize the generation array if needed
      if (person) {
        if (person.generation != undefined) {
          if (!Array.isArray(generations[person.generation])) {
            generations[person.generation] = new Array<TreePerson>();
          }
          generations[person.generation].push(person);
        } else {
          person.generation = 0;
        }
        const father = findFatherForChild(person.data);
        if (father) {
          const node: TreePerson = {
            id: father.id,
            name: ine.displayName(father),
            generation: (person.generation ?? 0) + 1,
            data: father,
            parents: null,
          };
          if (!this.extended_family.has(father.id)) {
            queue.push(node);
            this.extended_family.set(father.id, node);
          }

          if (Array.isArray(person.parents)) {
            person.parents.push(node);
          } else {
            person.parents = [node];
          }
        }

        const mother = findMotherForChild(person.data);
        if (mother) {
          const node: TreePerson = {
            id: mother.id,
            name: ine.displayName(mother),
            generation: (person.generation ?? 0) + 1,
            data: mother,
            parents: null,
          };

          if (!this.extended_family.has(mother.id)) {
            queue.push(node);
            this.extended_family.set(mother.id, node);
          }

          if (Array.isArray(person.parents)) {
            person.parents.push(node);
          } else {
            person.parents = [node];
          }
        }
      }
    }

    // 5. Build the HTML table.
    // The header row includes a "Generation" label plus columns for each person slot.
    /*
      let html = "\n";
      html += this.printList(generations[0][0], 0, true);
      return html;
    */
    return drawTree(this.extended_family);
  };

  protected printList = (
    localRoot: TreePerson,
    generation = 0,
    isRoot = false
  ) => {
    if (DEBUG) {
      console.log(
        `printList called for generation ${generation} and localRoot ${localRoot.id}`
      );
    }

    let returnable = "";
    if (isRoot) {
      returnable += `<ul class="ascending-tree" id="generations-${generation}">`;
    }

    const ine = new IndividualName();

    if (DEBUG) {
      console.log(`current localRoot is is `, localRoot.id);
    }
    if (Array.isArray(localRoot.parents) && localRoot.parents.length) {
      returnable += `
                <li class="ascending-tree">
                  <ul class="${Array.isArray(localRoot.parents) && localRoot.parents.length ? "ascending-tree" : "leaf"}" id="generations-${generation + 1}">
                    ${localRoot.parents.map((p) => this.printList(p as TreePerson, generation + 1)).join("\n")}
                  </ul>
                  <span>
                    ${ine.displayName(localRoot.data)}
                  </span>
                </li>
              `;
    } else {
      returnable += `
                <li class="leaf">
                  <span>
                    ${ine.displayName(localRoot.data)}
                  </span>
                </li>
              `;
    }

    if (isRoot) {
      returnable += "</ul>";
    }
    return returnable;
  };

  async connectedCallback() {
    this.populateLocalAttributes();

    const template = document.createElement("template");
    template.innerHTML = `
      <div id="familyTree" class="svg-container">
      </div>
    `;

    const rootPerson = GrampsState.people.get(this.grampsId);
    if (rootPerson) {
      const ine = new IndividualName();
      const rootNode: TreePerson = {
        id: rootPerson.id,
        name: ine.displayName(rootPerson),
        generation: 0,
        data: rootPerson,
        parents: new Array<TreePerson>(),
      };

      this.extended_family.set(rootNode.id, rootNode);

      const table = await this.buildGenerationTable(rootNode);
      if (DEBUG) {
        console.log(
          `after buildGenerationTable, I have map with size ${this.extended_family.size}`
        );
      }
      if (table) {
        const familyTreeDiv = template.content.querySelector("#familyTree");
        if (familyTreeDiv) {
          familyTreeDiv.appendChild(table);
        }
      }
    }

    this.appendChild(template.content.cloneNode(true));
  }
}
customElements.define("ancestors-treechart", AncestorsTreeChart);
