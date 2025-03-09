import * as d3 from "d3";

import debugFunction from "../../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

import { type TreePerson } from "./TreePerson";

import "../Individual.ts";
import IndividualName from "../IndividualName.ts";

const getLabel = (d: TreePerson) => {
  const p = new IndividualName();
  p.personId = d.id;
  return p.displayName(d.data);
};

const drawTree = (flatData: TreePerson[], containerElement: Element) => {
  const container = d3.select(containerElement);
  if (container.empty()) {
    console.error(`drawTree container is empty`);
    return;
  } else {
    container.select("svg").remove(); // Prevent duplicate trees on re-render
  }

  // Set up dimensions (you can also use container.clientWidth/clientHeight)
  const width = 800;
  const height = 600;

  // Create an SVG element with viewBox and preserveAspectRatio for responsive scaling
  const svg = container
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  // Define margins
  const margin = { top: 50, right: 50, bottom: 50, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Convert the flat data into a hierarchy using d3.stratify
  const rootNode = d3
    .stratify<TreePerson>()
    .id((d) => d.id)
    .parentId((d) => d.parentId)(flatData);

  // Create a tree layout.
  // Here we use innerWidth for horizontal spacing (d.x) and innerHeight for vertical (d.y)
  const treeLayout = d3.tree<TreePerson>().size([innerWidth, innerHeight]);

  // Compute the layout
  treeLayout(rootNode);

  // Flip the vertical coordinate so that the root (which was at d.y=0) is at the bottom.
  rootNode.each((d) => {
    d.y = innerHeight - (d.y ?? 0);
  });

  // Draw links using a vertical link generator:
  const linkGenerator = d3
    .linkVertical<
      d3.HierarchyPointLink<TreePerson>,
      d3.HierarchyPointNode<TreePerson>
    >()
    .x((d) => d.x)
    .y((d) => d.y);

  g.selectAll(".link")
    .data(rootNode.links())
    .enter()
    .append("path")
    .attr("class", "link")
    .attr("d", (d) => linkGenerator(d))
    .attr("fill", "none")
    .attr("stroke", "#ccc");

  // Draw nodes. Here we position nodes using d.x (horizontal) and d.y (vertical)
  const node = g
    .selectAll(".node")
    .data(rootNode.descendants())
    .enter()
    .append("g")
    .attr("class", "node")
    .attr("transform", (d) => `translate(${d.x},${d.y})`);

  node.append("circle").attr("r", 4).attr("fill", "steelblue");

  node
    .append("text")
    .attr("dy", 3)
    .attr("x", (d) => (d.children ? -8 : 8))
    .style("text-anchor", (d) => (d.children ? "end" : "start"))
    .text((d) => d.data.name);
};

export default drawTree;
