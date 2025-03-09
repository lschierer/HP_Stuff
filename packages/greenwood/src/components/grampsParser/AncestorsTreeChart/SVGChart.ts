import * as d3 from "d3";

import "@spectrum-web-components/card/sp-card.js";
import "iconify-icon";

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
  return `
    <sp-card
      variant="quiet"
      horizontal
      subheading="${d.id}"
      href="${p.buildLinkTarget(d.data)}"
      >
      <iconify-icon slot="preview" icon="${p.getIconName(d.data)}" width="none" inline class="${d.data.gender ? "color-male" : "color-female"}"></iconify-icon>
      <span class="gedcomCard-Heading spectrum-Heading spectrum-Heading--sizeXXS" slot="heading">${p.displayName(d.data)}</span>
    </sp-card>
  `;
};

const drawTree = (flatData: TreePerson[], containerElement: Element) => {
  const container = d3.select(containerElement);
  if (container.empty()) {
    console.error(`drawTree container is empty`);
    return;
  } else {
    container.select("svg").remove(); // Prevent duplicate trees on re-render
  }

  // Set up dimensions (or use containerElement.clientWidth/clientHeight)
  const width = 1250;
  const height = 900;

  // Define the size of the rectangular node.
  const nodeWidth = 140;
  const nodeHeight = 60;

  // Create an SVG element with viewBox and preserveAspectRatio for responsive scaling
  const svg = container
    .append("svg")
    .attr("class", "svg-content")
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

  // Compute the layout (assigns x and y positions)
  treeLayout(rootNode);

  // Flip the vertical coordinate so that the root (which was at d.y = 0) is at the bottom.
  rootNode.each((d) => {
    d.y = innerHeight - (d.y ?? 0);
  });

  // Adjust link endpoints so that they stop at the node borders.
  // For a vertical layout with the root at the bottom:
  // - Parent (source) link: use y - nodeSize/2 (top edge of parent's square).
  // - Child (target) link: use y + nodeSize/2 (bottom edge of child's square).
  const adjustedLinks = rootNode.links().map((link) => ({
    source: {
      x: link.source.x,
      /* eslint-disable-next-line */
      y: link.source.y! - nodeHeight / 2,
    },
    target: {
      x: link.target.x,
      /* eslint-disable-next-line */
      y: link.target.y! + nodeHeight / 2,
    },
  }));

  // Draw links using a vertical link generator:
  const linkGenerator = d3
    .linkVertical<
      d3.HierarchyPointLink<TreePerson>,
      d3.HierarchyPointNode<TreePerson>
    >()
    .x((d) => d.x)
    .y((d) => d.y);

  g.selectAll(".link")
    .data(adjustedLinks)
    .enter()
    .append("path")
    .attr("class", "link")
    .attr("d", (d) => linkGenerator(d))
    .attr("fill", "none")
    .attr("stroke", "#ccc");

  // Draw nodes. Position nodes using d.x (horizontal) and d.y (vertical)
  const node = g
    .selectAll(".node")
    .data(rootNode.descendants())
    .enter()
    .append("g")
    .attr("class", "node")
    .attr("transform", (d) => `translate(${d.x},${d.y})`);

  node
    .append("rect")
    .attr("x", -nodeWidth / 2)
    .attr("y", -nodeHeight / 2)
    .attr("width", nodeWidth)
    .attr("height", nodeHeight)
    .attr("fill", "none")
    .attr("stroke", "steelblue");

  // Append text inside the node. Center the text both horizontally and vertically.
  node
    .append("foreignObject")
    .attr("x", -nodeWidth / 2)
    .attr("y", -nodeHeight / 2)
    .attr("width", nodeWidth)
    .attr("height", nodeHeight)
    .append("xhtml:div")
    .style("width", `${nodeWidth}px`)
    .style("height", `${nodeHeight}px`)
    .style("display", "flex")
    .style("align-items", "start")
    .style("justify-content", "center")
    // Use CSS to wrap text as needed; here we allow wrapping and center text
    .style("text-align", "center")
    .style("font-size", "10px")
    .html((d) => getLabel(d.data));
};

export default drawTree;
