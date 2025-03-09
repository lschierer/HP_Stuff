import { StringEnum as PersonStrings } from "../../../schemas/gedcom/person.ts";

import { type GedcomPerson } from "../../../schemas/gedcom/index.ts";

import "../IndividualName.ts";

import GrampsState from "../state.ts";
import { findFatherForChild, findMotherForChild } from "../state.ts";

import { TreePerson } from "./TreePerson.ts";
import IndividualName from "../IndividualName.ts";

import debugFunction from "../../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

export default class AncestorsTreeChart extends HTMLElement {
  public grampsId: string = "";
  public isRoot: boolean = false;
  public maxDepth: number = -1;

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

  protected treeSetup = () => {
    const rootPerson = GrampsState.people.get(this.grampsId);
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
        this.addToTree(node, 0);
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

  protected addToTree(localRootNode: TreePerson, generation: number = -2) {
    if (generation < 0) {
      generation = 0;
    }
    if (DEBUG) {
      console.log(`finding parents of ${localRootNode.id} to add to tree`);
    }
    const ine = new IndividualName();

    const father = findFatherForChild(localRootNode.data);
    if (father) {
      if (DEBUG) {
        console.log(`found father "${father.id}" for "${localRootNode.id}"`);
      }
      const parentNode: TreePerson = {
        name: ine.displayName(father),
        id: father.id,
        generation: generation,
        data: father,
        parentId: null,
      };

      if (localRootNode.parentId) {
        localRootNode.parentId.push(father.id);
      } else {
        localRootNode.parentId = [father.id];
      }

      if (generation < this.maxDepth) {
        this.treeData.push(parentNode);
      }
    }

    const mother = findMotherForChild(localRootNode.data);
    if (mother) {
      if (DEBUG) {
        console.log(`found mother "${mother.id}" for "${localRootNode.id}"`);
      }
      const parentNode: TreePerson = {
        name: ine.displayName(mother),
        id: mother.id,
        generation: generation,
        data: mother,
        parentId: null,
      };

      if (localRootNode.parentId) {
        localRootNode.parentId.push(mother.id);
      } else {
        localRootNode.parentId = [mother.id];
      }

      if (generation < this.maxDepth) {
        this.treeData.push(parentNode);
      }
    }
  }

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
        `;
      const graphDiv = template.content.querySelector(graphSelector);
      if (graphDiv) {
        //drawTree(this.treeData, graphDiv);
      }
    }

    this.appendChild(template.content.cloneNode(true));
  }
}
customElements.define("ancestors-treechart", AncestorsTreeChart);
