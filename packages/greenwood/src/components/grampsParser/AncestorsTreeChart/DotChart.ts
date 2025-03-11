import {
  attribute as dotAttribute,
  Digraph,
  Edge,
  Node,
  toDot,
  Subgraph,
} from "ts-graphviz";
import { Graphviz } from "@hpcc-js/wasm-graphviz";

import { type TreePerson } from "./TreePerson.ts";

import "../IndividualName.ts";
import IndividualName from "../IndividualName.ts";

import debugFunction from "../../../lib/debug.ts";

const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

// 1. Compute levels for each node using BFS
const computeLevels = (
  treeMap: Map<string, TreePerson>
): Map<string, number> => {
  if (DEBUG) {
    console.log(
      `computeLevels start with treeMap of ${treeMap.size} TreePersons`
    );
  }
  const levels = new Map<string, number>();

  // Find the unique root node (node with an empty parent list)
  let root: TreePerson | undefined;
  const notRoot = new Set<string>();
  for (const node of treeMap.values()) {
    if (Array.isArray(node.parents) && node.parents.length) {
      node.parents.forEach((pid) => notRoot.add(pid));
    }
  }
  for (const node of treeMap.values()) {
    if (!notRoot.has(node.id)) {
      root = node;
      break;
    }
  }
  if (!root) {
    throw new Error("No root node found");
  } else {
    if (DEBUG) {
      console.log(`found root ${root.id}`);
    }
  }

  const queue: { id: string; level: number }[] = [];
  queue.push({ id: root.id, level: 0 });
  levels.set(root.id, 0);

  while (queue.length > 0) {
    const { id, level } = queue.shift() ?? { id: "", level: -1 };
    if (!id.length) {
      if (DEBUG) {
        console.warn(`while que.legth ... shift returned an invalid id`);
      }
      continue;
    }
    // Find children: nodes that have this id in their parent array
    const node = treeMap.get(id);
    if (node) {
      node.parents.forEach((n2) => {
        // If not already visited or found a shorter path, update its level
        if (!levels.has(n2) || level + 1 < (levels.get(n2) ?? -1)) {
          levels.set(n2, level + 1);
          queue.push({ id: n2, level: level + 1 });
        }
      });
    }
  }
  if (DEBUG) {
    console.log(`computeLevels returning ${levels.size} levels`);
  }
  return levels;
};

const groupByLevel = (levels: Map<string, number>): Map<number, string[]> => {
  if (DEBUG) {
    console.log(`groupByLevel starts with ${levels.size} levels`);
  }
  const groups = new Map<number, string[]>();
  for (const [id, level] of levels) {
    if (!groups.has(level)) {
      groups.set(level, []);
    }
    const gl = groups.get(level);
    if (gl) {
      gl.push(id);
    }
  }
  if (DEBUG) {
    console.log(`groupByLevel returns ${groups.size} groups`);
  }
  return groups;
};

const initialSetup = (treeMap: Map<string, TreePerson>) => {
  const levels = computeLevels(treeMap);
  const levelGroups = groupByLevel(levels);
  const graph = new Digraph("G");
  const ine = new IndividualName();

  // Create nodes
  for (const node of treeMap.values()) {
    graph.addNode(
      new Node(node.id, {
        [dotAttribute.label]: ine.displayName(node.data),
        [dotAttribute.shape]: "rect",
      })
    );
  }

  // Create edges based on the parent relationship
  for (const person of treeMap.values()) {
    for (const parentId of person.parents) {
      const parent = treeMap.get(parentId);
      if (parent) {
        const parentNode = graph.getNode(parentId);
        if (parentNode) {
          const personNode = graph.getNode(person.id);
          if (personNode) {
            if (parent.data.gender) {
              graph.addEdge(
                new Edge([personNode, parentNode], {
                  [dotAttribute.class]: "familyNode father",
                  [dotAttribute.dir]: "back",
                })
              );
            } else {
              graph.addEdge(
                new Edge([personNode, parentNode], {
                  [dotAttribute.class]: "familyNode mother",
                  [dotAttribute.dir]: "back",
                })
              );
            }
          }
        }
      } else {
        if (DEBUG) {
          console.log(`treeMap.get returned invalid value for ${parentId}`);
        }
      }
    }
  }

  // 4. For each level, create a subgraph with rank="same"
  for (const [level, nodeIds] of levelGroups) {
    const sub = new Subgraph(`cluster_rank_${level}`, {
      [dotAttribute.rank]: "same",
      [dotAttribute.class]: "clusterNode",
    });
    graph.addSubgraph(sub);
    nodeIds.forEach((id) => {
      const node = graph.getNode(id);
      if (node) {
        sub.addNode(node);
      }
    });
  }
  return graph;
};

const drawTree = async (familyMembers: Map<string, TreePerson>) => {
  const G = initialSetup(familyMembers);
  G.attributes.node.set("shape", "box");
  G.set(dotAttribute.rankdir, "BT");
  G.set(dotAttribute.ordering, "in");
  G.attributes.edge.set(dotAttribute.dir, "forward");
  G.set(dotAttribute.layout, "dot");
  G.set(dotAttribute.ranksep, 0.75);
  G.set(dotAttribute.bgcolor, "transparent");

  const dot = toDot(G);
  const graphviz = await Graphviz.load();
  let svgString = graphviz.dot(dot);
  svgString = svgString.replaceAll(/(stroke|fill)="(black|none)"/g, "");
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
