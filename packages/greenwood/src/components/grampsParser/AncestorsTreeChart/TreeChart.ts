import { StringEnum as PersonStrings } from "../../../schemas/gedcom/person.ts";
import { StringEnum as FamilyStrings } from "../../../schemas/gedcom/family.ts";

import { type GedcomPerson } from "../../../schemas/gedcom/index.ts";

import "../IndividualName.ts";

import GrampsState from "../state.ts";

import drawTree from "./SVGChart.ts";

import { TreePerson } from "./TreePerson.ts";

import debugFunction from "../../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

export default class AncestorsTreeChart extends HTMLElement {
  public grampsId: string = "";
  public isRoot: boolean = false;
  public maxDepth: number = -1;

  private generations: number = this.maxDepth != -1 ? this.maxDepth : 2;
  private treeData: TreePerson[] = new Array<TreePerson>();
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
      name = name.concat(` (${person.primary_name.nick})`);
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
      name = name.concat(` ${lastName.surname}`);
    }
    if (person.primary_name.suffix) {
      name = name.concat(` ${person.primary_name.suffix}`);
    }
    return name;
  };

  protected addToTree = (
    localRootPerson: GedcomPerson.GedcomElement | undefined,
    localRootNode: TreePerson,
    generation: number = -1
  ): void => {
    if (localRootPerson === undefined) {
      if (DEBUG) {
        console.warn(`addToTree localRoot is undefined`);
      }
    } else if (generation > this.generations && this.generations > 0) {
      if (DEBUG) {
        console.log(
          `I have reached the max generations, ${this.generations} is exceeded by ${generation}`
        );
      }
    } else {
      if (DEBUG) {
        console.log(`addToTree for localRoot ${localRootNode.id}`);
      }

      const father = GrampsState.people.find((p) => {
        const family = GrampsState.families.find((f) => {
          if (p.family_list.includes(f.handle)) {
            const cf = f.child_ref_list.find((c) => {
              return !c.ref.localeCompare(localRootPerson.handle);
            });
            if (cf) {
              if (DEBUG) {
                console.log(`found family with cf ${f.id}`);
              }
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
          return !p.handle.localeCompare(family.father_handle);
        }
        return false;
      });
      if (father && !this.PresentInTree.has(father.id)) {
        if (DEBUG) {
          console.log(`found father ${father.id} for ${localRootPerson.id}`);
        }
        this.PresentInTree.add(father.id);
        const node: TreePerson = {
          name: this.nameForPerson(father),
          id: father.id,
          generation: localRootNode.generation + 1,
          data: father,
          parentId: localRootPerson.id,
        };
        const valid = TreePerson.safeParse(node);
        if (valid.success) {
          this.PresentInTree.add(father.id);
          this.treeData.push(node);
          this.addToTree(
            father,
            node,
            generation >= 0 ? generation + 1 : generation
          );
        } else {
          if (DEBUG) {
            console.error(
              `failed to create TreePerson for Father`,
              valid.error.message
            );
          }
        }
      }

      const mother = GrampsState.people.find((p) => {
        const family = GrampsState.families.find((f) => {
          if (p.family_list.includes(f.handle)) {
            const cf = f.child_ref_list.find((c) => {
              return !c.ref.localeCompare(localRootPerson.handle);
            });
            if (cf) {
              if (!cf.mrel.string.localeCompare(FamilyStrings.Enum.Birth)) {
                return true;
              }
              if (!cf.frel.string.localeCompare(FamilyStrings.Enum.Birth)) {
                return true;
              }
            }
          }
          return false;
        });
        if (family && family.mother_handle) {
          return !p.handle.localeCompare(family.mother_handle);
        }
        return false;
      });
      if (mother && !this.PresentInTree.has(mother.id)) {
        if (DEBUG) {
          console.log(`found mother ${mother.id} for ${localRootPerson.id}`);
        }
        this.PresentInTree.add(mother.id);
        const node: TreePerson = {
          name: this.nameForPerson(mother),
          id: mother.id,
          generation: localRootNode.generation + 1,
          data: mother,
          parentId: localRootPerson.id,
        };
        const valid = TreePerson.safeParse(node);
        if (valid.success) {
          this.treeData.push(node);
          this.PresentInTree.add(mother.id);
          this.addToTree(
            mother,
            node,
            generation >= 0 ? generation + 1 : generation
          );
        } else {
          if (DEBUG) {
            console.error(
              `failed to create TreePerson for mother`,
              valid.error.message
            );
          }
        }
      }
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
      const node: TreePerson = {
        name: this.nameForPerson(rootPerson),
        id: rootPerson.id,
        generation: 0,
        data: rootPerson,
        parentId: null,
      };
      const valid = TreePerson.safeParse(node);
      if (valid.success) {
        this.PresentInTree.add(valid.data.id);
        this.treeData.push(node);
        this.addToTree(rootPerson, node, 0);
      } else {
        if (DEBUG) {
          console.error(
            `failed to create node for root person ${this.grampsId}`,
            valid.error.message
          );
        }
      }

      if (DEBUG) {
        console.log(`treeData is \n`, JSON.stringify(this.treeData));
      }
    }
  };

  connectedCallback() {
    this.populateLocalAttributes();
    this.treeSetup();
    const template = document.createElement("template");
    template.innerHTML = `
      <div id="familyTree" class="svg-container">
      </div>
    `;
    if (this.treeData.length) {
      if (DEBUG) {
        console.log(`connectedCallback sees populated treeData`);
      }
      const graphSelector = "#familyTree";
      this.innerHTML = `
        ${DEBUG ? `<p class="spectrum-Body spectrum-Body--sizeXXS">AncestorsTreeChart</p>` : ""}
        `;
      const graphDiv = template.content.querySelector(graphSelector);
      if (graphDiv) {
        drawTree(this.treeData, graphDiv);
      }
    }

    this.appendChild(template.content.cloneNode(true));
  }
}
customElements.define("ancestors-treechart", AncestorsTreeChart);
