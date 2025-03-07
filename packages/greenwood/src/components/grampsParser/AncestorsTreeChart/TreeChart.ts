import { OrgChart } from "d3-org-chart";

import { StringEnum as PersonStrings } from "../../../schemas/gedcom/person.ts";
import { StringEnum as FamilyStrings } from "../../../schemas/gedcom/family.ts";

import { type GedcomPerson } from "../../../schemas/gedcom/index.ts";

import "../IndividualName.ts";

import GrampsState from "../state.ts";

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
  private treeData = new Array<TreePerson>();
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
    localRoot: GedcomPerson.GedcomElement | undefined
  ): void => {
    if (localRoot == undefined) {
      if (DEBUG) {
        console.warn(`addToTree localRoot is undefined`);
      }
    } else {
      if (DEBUG) {
        console.log(`addToTree for localRoot ${localRoot.id}`);
      }

      const father = GrampsState.people.find((p) => {
        const family = GrampsState.families.find((f) => {
          if (p.family_list.includes(f.handle)) {
            const cf = f.child_ref_list.find((c) => {
              return !c.ref.localeCompare(localRoot.handle);
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
          console.log(`found father ${father.id} for ${localRoot.id}`);
        }
        this.PresentInTree.add(father.id);
        const node: TreePerson = {
          name: this.nameForPerson(father),
          id: father.id,
          parentId: localRoot.id,
        };
        const valid = TreePerson.safeParse(node);
        if (valid.success) {
          this.treeData.push(valid.data);
          this.PresentInTree.add(father.id);
          this.addToTree(father);
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
              return !c.ref.localeCompare(localRoot.handle);
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
          console.log(`found mother ${mother.id} for ${localRoot.id}`);
        }
        this.PresentInTree.add(mother.id);
        const node: TreePerson = {
          name: this.nameForPerson(mother),
          id: mother.id,
          parentId: localRoot.id,
        };
        const valid = TreePerson.safeParse(node);
        if (valid.success) {
          this.treeData.push(valid.data);
          this.PresentInTree.add(mother.id);
          this.addToTree(mother);
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
        parentId: "",
      };
      const valid = TreePerson.safeParse(node);
      if (valid.success) {
        this.treeData.push(valid.data);
        this.PresentInTree.add(valid.data.id);
        this.addToTree(rootPerson);
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
    this.innerHTML = `
      ${DEBUG ? `<span>AncestorsTreeChart</span><br/>` : ""}
      <div id="familyTree">
      </div>
      `;

    if (this.treeData.length) {
      if (DEBUG) {
        console.log(`connectedCallback sees populated treeData`);
      }
      new OrgChart().container("#familyTree").data(this.treeData).render();
    }
  }
}
customElements.define("ancestors-treechart", AncestorsTreeChart);
