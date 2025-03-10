import cytoscape from 'cytoscape';


import "@spectrum-web-components/card/sp-card.js";
import "iconify-icon";

import debugFunction from "../../../lib/debug.ts";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}

import { type TreePerson } from "./TreePerson.ts";

import "../Individual.ts";
import IndividualName from "../IndividualName.ts";

const getLabel = (d: TreePerson) => {
  const p = new IndividualName();
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

const drawDAG = (
  personsMap: Map<string, TreePerson>,
  containerElement: Element
) => {
  // Create nodes array
  const cyNodes = new Array<cytoscape.ElementsDefinition>();

  personsMap.forEach((person) => {
    const node:cytoscape.ElementsDefinition = {
      nodes
    }
    cyNodes.push(node)
    );

    const cyEdges: { data: { id: string; source: string; target: string } }[] = [];
    personsMap.forEach(person => {
      if(person.parentId) {
        person.parentId.forEach(childId => {
          cyEdges.push({
            data: { id: `${person.id}-${childId}`, source: person.id, target: childId }
          });
        });
      }
    });

    // Initialize Cytoscape
    const cy = cytoscape({
      container: document.getElementById('graph-container'), // your container
      elements: [...cyNodes, ...cyEdges],
      layout: {
        name: 'dagre', // if you install cytoscape-dagre extension; otherwise, try 'breadthfirst'
        rankDir: 'TB', // 'TB' for top-to-bottom or 'BT' for bottom-to-top depending on your needs
      },
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            'text-valign': 'center',
            'background-color': '#ddd',
            'text-outline-width': 1,
            'text-outline-color': '#888'
          }
        },
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': '#999',
            'target-arrow-color': '#999',
            'target-arrow-shape': 'triangle'
          }
        }
      ]
    });

  void elk.layout(elkGraph).then((layout) => {
    // layout.children now contains the computed positions for each node.
    if (layout.children) {
      layout.children.forEach((node: ElkNode) => {
        if (Object.keys(node).includes("id")) {
          if (Object.keys(node).includes("x")) {
            if (Object.keys(node).includes("y")) {
              const id = node["id" as keyof typeof node] as string;
              const x = node["x" as keyof typeof node] as number;
              const y = node["y" as keyof typeof node] as number;
              const person = personsMap.get(node.id);
              if (DEBUG) {
                console.log(
                  `Node ${id} at (${x}, ${y}) ${person ? "found" : "did not find"} ${person ? person.id : node.id}`
                );
              }

              const template = document.createElement("template");
              template.innerHTML = person
                ? getLabel(person)
                : node.labels
                  ? (node.labels[0].text ?? "badly defined node label")
                  : "undefined node label";
              const card = template.content.querySelector("sp-card");
              if (card) {
                // Position the card absolutely using the layout positions.
                // ELK positions are for the top-left of each node.
                card.style.position = "absolute";
                card.style.left = `${x}px`;
                card.style.top = `${y}px`;

                containerElement.appendChild(template.content.cloneNode(true));
              }
            }
          }
        }

        // Append the card to your container (ensure it exists in your HTML)
        document.getElementById("graph-container")?.appendChild(card);
      });
    }
  });
};

export default drawDAG;
