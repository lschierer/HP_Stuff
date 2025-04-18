import { type TreePerson } from "@hp-stuff/schemas/gedcom";
import { IndividualName } from "./IndividualName";

import debugFunction from "../shared/debug";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

import {
  persons,
  findFatherForPerson,
  findMotherForPerson,
} from "./import_potter_data";

import drawTree from "./DotChart";

export default class AncestorsTreeChart {
  public grampsId: string = "";
  public isRoot: boolean = false;
  public maxDepth: number = -1;

  private extended_family = new Map<string, TreePerson>();

  constructor(grampsID: string, maxDepth: number, isRoot: boolean = true) {
    this.grampsId = grampsID;
    this.maxDepth = maxDepth;
    this.isRoot = isRoot;
  }

  buildGenerationTable = (root: TreePerson) => {
    // 2. root is already found and passed to this function.

    // 3. Use a breadth-first search (BFS) to determine generations
    const generations: TreePerson[][] = new Array<Array<TreePerson>>();
    const queue: TreePerson[] = [{ ...root, generation: 0 }];

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
        const father = findFatherForPerson(person.data);
        if (father !== null) {
          const fatherName = new IndividualName(father);
          const node: TreePerson = {
            id: father.gramps_id,
            name: fatherName.displayName(),
            generation: (person.generation ?? 0) + 1,
            data: father,
            parents: new Array<string>(),
          };
          if (!this.extended_family.has(father.gramps_id)) {
            queue.push(node);
            this.extended_family.set(father.gramps_id, node);
          }

          if (Array.isArray(person.parents)) {
            person.parents.push(node.id);
          } else {
            person.parents = [node.id];
          }
        }

        const mother = findMotherForPerson(person.data);
        if (mother) {
          const motherName = new IndividualName(mother);
          const node: TreePerson = {
            id: mother.gramps_id,
            name: motherName.displayName(),
            generation: (person.generation ?? 0) + 1,
            data: mother,
            parents: new Array<string>(),
          };

          if (!this.extended_family.has(mother.gramps_id)) {
            queue.push(node);
            this.extended_family.set(mother.gramps_id, node);
          }

          if (Array.isArray(person.parents)) {
            person.parents.push(node.id);
          } else {
            person.parents = [node.id];
          }
        }
      }
    }

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

    const LocalRootName = new IndividualName(localRoot.data);

    if (DEBUG) {
      console.log(`current localRoot is is `, localRoot.id);
    }

    if (Array.isArray(localRoot.parents) && localRoot.parents.length) {
      returnable += `
                <li class="ascending-tree">
                  <ul class="${Array.isArray(localRoot.parents) && localRoot.parents.length ? "ascending-tree" : "leaf"}" id="generations-${generation + 1}">
                    ${localRoot.parents
                      .map((p) => {
                        const pi = this.extended_family.get(p);
                        if (pi) {
                          return this.printList(pi, generation + 1);
                        } else return "";
                      })
                      .join("\n")}
                  </ul>
                  <span>
                    ${LocalRootName.displayName()}
                  </span>
                </li>
              `;
    } else {
      returnable += `
                <li class="leaf">
                  <span>
                    ${LocalRootName.displayName()}
                  </span>
                </li>
              `;
    }

    if (isRoot) {
      returnable += "</ul>";
    }
    return returnable;
  };

  readonly printTree = async () => {
    const rootPerson = persons.find((p) => p.gramps_id === this.grampsId);
    if (rootPerson) {
      const LocalRootName = new IndividualName(rootPerson);
      const rootNode: TreePerson = {
        id: rootPerson.gramps_id,
        name: LocalRootName.displayName(),
        generation: 0,
        data: rootPerson,
        parents: new Array<string>(),
      };

      this.extended_family.set(rootNode.id, rootNode);

      const table = await this.buildGenerationTable(rootNode);
      if (DEBUG) {
        console.log(
          `after buildGenerationTable, I have map with size ${this.extended_family.size}`
        );
      }
      if (table && table.length) {
        return `
          <div class="TimelineCard rounded border-2">
            <div id="familyTree" class="svg-container">
              ${table}
            </div>
          </div>
        `;
      }
    }
    return "";
  };
}
