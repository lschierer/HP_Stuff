import {
  attribute as dotAttribute,
  Digraph,
  Node,
  Edge,
  toDot,
  Subgraph,
} from "ts-graphviz";
import { Graphviz } from "@hpcc-js/wasm-graphviz";

import { TreePerson } from "./TreePerson.ts";

import "../IndividualName.ts";
import IndividualName from "../IndividualName.ts";

import debugFunction from "../../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

const drawTree = async (familyMembers: Map<string, TreePerson>) => {
  const G = new Digraph();
  G.attributes.node.set("shape", "box");
  G.set(dotAttribute.rankdir, "BT");
  G.attributes.edge.set(dotAttribute.dir, "forward");
  G.set(dotAttribute.layout, "dot");
  G.set(dotAttribute.ordering, "out");
  G.set(dotAttribute.ranksep, 0.5);
  G.set(dotAttribute.bgcolor, "transparent");

  const Generations = new Array<Node[]>();

  const ine = new IndividualName();

  familyMembers.forEach((person) => {
    const node = new Node(person.id, {
      [dotAttribute.color]: "green",
      [dotAttribute.label]: ine.displayName(person.data),
    });
    if (Array.isArray(Generations[person.generation ?? 0])) {
      const index = person.generation ?? 0;
      Generations[index].push(node);
    } else {
      const index = person.generation ?? 0;
      Generations[index] = [node];
    }
  });

  if (DEBUG) {
    console.log(`generations look like`);
    Generations.forEach((generation, index) => {
      console.log(
        index,
        generation
          .map((p) => {
            return p.id;
          })
          .join("; ")
      );
    });
  }

  const parentsToFamily = new WeakMap<Node, Node>();
  const peopleToFamily = new WeakMap<Node, Node>();
  const generationNodes = new Array<Node>();
  Generations.forEach((generation, index) => {
    const gn = new Node(`G=${index}`, {
      label: "",
      //[dotAttribute.style]: "invis",
      [dotAttribute.color]: "orange",
      [dotAttribute.shape]: "point",
      [dotAttribute.pos]: `[0,${Generations.length - index}!]`,
    });
    G.addNode(gn);

    if (index > 0) {
      const prior = generationNodes.slice(-1)[0];
      const e = new Edge([prior, gn], {
        [dotAttribute.color]: "orange",
        //[dotAttribute.style]: "invis",
      });
      G.addEdge(e);
    }
    generationNodes.push(gn);

    const g2 = new Subgraph(`g-${index}`);
    G.addSubgraph(g2);
    g2.addNode(generationNodes.slice(-1)[0]);

    generation.forEach((personNode, index2) => {
      const person = familyMembers.get(personNode.id);

      if (person) {
        if (parentsToFamily.has(personNode)) {
          const family = parentsToFamily.get(personNode);
          if (family) {
            if (!g2.existNode(family.id)) {
              if (DEBUG) {
                console.log(
                  `adding family ${family.id} to generation ${index} `
                );
              }
              g2.addNode(family);
            }
          }
        }
        if (
          !peopleToFamily.has(personNode) &&
          Array.isArray(person.data.parent_family_list) &&
          person.data.parent_family_list.length
        ) {
          const fid = person.data.parent_family_list[0];
          const family = new Node(`f-${fid}`, {
            label: `f-${fid}`,
            height: 0.01,
            width: 0.01,
            color: "purple",
          });

          peopleToFamily.set(personNode, family);
        } else {
          const family = peopleToFamily.get(personNode);
          if (family) {
            peopleToFamily.set(personNode, family);
          } else {
            console.warn(`peopleToFamily returned invalid family`);
          }
        }

        g2.addNode(personNode);

        if (person.parents) {
          const nextgen = Generations[index + 1];

          if (Array.isArray(nextgen) && Array.isArray(person.parents)) {
            person.parents.forEach((parentIdentifer) => {
              const valid = TreePerson.safeParse(parentIdentifer);
              if (valid.success) {
                const parentNode = nextgen.find((ng) => {
                  return !ng.id.localeCompare(valid.data.id);
                });
                if (parentNode) {
                  const parent = familyMembers.get(parentNode.id);
                  if (parent) {
                    if (parentsToFamily.has(parentNode)) {
                      const family = parentsToFamily.get(parentNode);
                      if (family) {
                        if (parent.data.gender) {
                          g2.addEdge(new Edge([parentNode, family]));
                        } else {
                          g2.addEdge(new Edge([family, parentNode]));
                        }
                      } else {
                        if (DEBUG) {
                          console.warn(
                            `parentsToFamily set returned an invalid family`
                          );
                        }
                      }
                    } else {
                      const family = peopleToFamily.get(personNode);
                      if (family) {
                        if (parent.data.gender) {
                          g2.addEdge(new Edge([parentNode, family]));
                        } else {
                          g2.addEdge(new Edge([family, parentNode]));
                        }
                        parentsToFamily.set(parentNode, family);
                      }
                    }
                  } else {
                    if (DEBUG) {
                      console.error(
                        `cannot find parent for parentNode ${parentNode.id}`
                      );
                    }
                  }
                }
              } else {
                if (DEBUG) {
                  console.log(
                    `zod believes parentIdentifer is not a TreePerson`
                  );
                }
              }
            });
          }
        }
      }
    });

    if (g2.nodes.length) {
      g2.set("rank", "same");
    }
  });

  const dot = toDot(G);
  const graphviz = await Graphviz.load();
  const svgString = graphviz.dot(dot);
  if (DEBUG) {
    console.log(
      `created dot file \n`,
      dot
      //`\n created svg \n ${svg.toString()}`
    );
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const svg = doc.querySelector("svg");
  if (svg) {
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
  }
  return svg;
};
export default drawTree;
