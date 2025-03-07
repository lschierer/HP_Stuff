import * as d3 from "d3";
import { TreePerson } from "./TreePerson";

import "../Individual.ts";
import IndividualName from "../IndividualName.ts";

const getLabel = (d: TreePerson) => {
  const p = new IndividualName();
  p.personId = d.id;
  return p.displayName(d.data);
};

interface NodeData {
  name: string;
  children?: NodeData[];
}

const draw_tree = (svg, my_data, my_type, my_x, my_y, transition) => {
  //my_x and my_y switch for vertical/horizontal

  //reset transform so proportion calculations work correctly
  svg.attr("transform", "translate(0,0) scale(1)");

  //append links
  const link_group = svg
    .selectAll(".link_group")
    .data(my_data.links())
    .join(function (group) {
      var enter = group.append("g").attr("class", "link_group");
      enter.append("path").attr("class", "tree_link");
      return enter;
    });

  link_group
    .select(".tree_link")
    .transition()
    .duration(transition)
    .attr(
      "d",
      my_type === "radial"
        ? d3
            .linkRadial()
            .angle((d) => d[my_y])
            .radius((d) => d[my_x])
        : d3
            .linkHorizontal()
            .x((d) => d[my_x])
            .y((d) => d[my_y])
    );

  //append nodes
  const node_group = svg
    .selectAll(".node_group")
    .data(my_data.descendants())
    .join(function (group) {
      var enter = group.append("g").attr("class", "node_group");
      enter.append("circle").attr("class", "node_circle");
      enter.append("text").attr("class", "node_label");
      return enter;
    });

  //circles - transforms different depending on whether radial or vertical/horizontal
  node_group
    .select(".node_circle")
    .attr("r", 2.5)
    .transition()
    .duration(transition)
    .attr("transform", (d) =>
      my_type === "radial"
        ? "rotate(" +
          ((d[my_y] * 180) / Math.PI - 90) +
          ") translate(" +
          d[my_x] +
          ",0)"
        : "translate(" + d[my_x] + "," + d[my_y] + ")"
    );

  //text - transform, text-anchor,x and dy different depending tree type and for vertical index === 0
  node_group
    .select(".node_label")
    .transition()
    .duration(transition)
    .attr("dy", (d, i) =>
      i === 0 && my_type === "vertical" ? "-1em" : "0.31em"
    )
    .attr("x", (d, i) =>
      my_type === "radial"
        ? d[my_y] < Math.PI === !d.children
          ? 6
          : -6
        : my_type === "vertical"
          ? i > 0
            ? !d.children
              ? -6
              : 6
            : 0
          : !d.children
            ? 6
            : -6
    )
    .attr("text-anchor", (d, i) =>
      my_type === "radial"
        ? d[my_y] < Math.PI === !d.children
          ? "start"
          : "end"
        : my_type === "vertical"
          ? i > 0
            ? !d.children
              ? "end"
              : "start"
            : "middle"
          : !d.children
            ? "start"
            : "end"
    )
    .text((d) => d.data.name)
    .attr("transform", (d, i) =>
      my_type === "radial"
        ? "rotate(" +
          ((d[my_y] * 180) / Math.PI - 90) +
          ") translate(" +
          d[my_x] +
          ",0) rotate(" +
          (d[my_y] >= Math.PI ? 180 : 0) +
          ")"
        : "translate(" +
          d[my_x] +
          "," +
          d[my_y] +
          ")" +
          (my_type === "vertical" ? (i > 0 ? " rotate(-90)" : "") : "")
    );

  //after transition is finished, re-calculate and reset svg
  //custom functionality as viewBox would not transition.
  var timer = d3.timer(function (elapsed) {
    if (elapsed > transition + 100) {
      timer.stop();

      //get dimensions
      var dimensions = new_dimensions(base_svg);
      var proportion = width / dimensions.width;
      var new_height = dimensions.height * proportion;

      //change base width and height.
      base_svg
        .transition()
        .duration(transition)
        .attr("width", width)
        .attr("height", new_height);

      //change tree translate and scale depending on proportions and dimensions
      svg
        .transition()
        .duration(transition)
        .attr(
          "transform",
          "translate(" +
            Math.abs(dimensions.x * proportion) +
            "," +
            Math.abs(dimensions.y * proportion) +
            ") " +
            " scale(" +
            proportion +
            ")"
        );
    }
  });
};

const setupD3 = (data: TreePerson[], container: HTMLElement) => {
  // Declare the chart dimensions and margins.
  const width = 928;
  let height = 500;
  const padding = 1;
  const curve = d3.curveBumpX;
  const r = 3;
  const fill = "#999";
  const stroke = "#555";
  const strokeWidth = 1.5;
  const strokeOpacity = 0.4;
  const halo = "#fff";
  const haloWidth = 3;
  const label = (d: TreePerson) => getLabel(d);

  const root = d3.stratify<TreePerson>()(data);

  const descendants = root.descendants();
  const L = descendants.map((d) => label(d.data));

  const dx = 10;
  const dy = width / (root.height + padding);
  const tree = d3.tree<TreePerson>().nodeSize([dx, dy * 2]);
  tree(root);

  // Center the tree.
  let x0 = Infinity;
  let x1 = -x0;

  root.each((d) => {
    if (d.x && d.x > x1) x1 = d.x;
    if (d.x && d.x < x0) x0 = d.x;
  });

  // Compute the default height.
  height = x1 - x0 + dx * 2;

  const svg = d3
    .create("svg")
    .attr("viewBox", [(-dy * padding) / 2, x0 - dx, width, height])
    .attr("width", width)
    .attr("height", height)
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10);

  svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", stroke)
    .attr("stroke-opacity", strokeOpacity)
    .attr("stroke-width", strokeWidth)
    .selectAll("path")
    .data(root.links())
    .join("path")
    .attr("d", (d) => {
      const linkGenerator = d3
        .link<d3.HierarchyPointLink<TreePerson>, [number, number]>(curve)
        .source((d) => [d.source.y, d.source.x])
        .target((d) => [d.target.y, d.target.x]);

      return linkGenerator(d as d3.HierarchyPointLink<TreePerson>);
    });

  const node = svg
    .append("g")
    .selectAll("a")
    .data(root.descendants())
    .join("a")
    .attr("transform", (d) => `translate(${d.y},${d.x})`);

  node
    .append("circle")
    .attr("fill", (d) => (d.children ? stroke : fill))
    .attr("r", r);

  if (L)
    node
      .append("text")
      .attr("dy", "0.32em")
      .attr("x", (d) => (d.children ? -6 : 6))
      .attr("text-anchor", (d) => (d.children ? "end" : "start"))
      .attr("paint-order", "stroke")
      .attr("stroke", halo)
      .attr("stroke-width", haloWidth)
      .text((d, i) => L[i]);

  const svgResult = svg.node();
  if (svgResult) {
    container.append(svgResult);
  }
};

const chart = (data: TreePerson[], container: HTMLElement) => {
  if (Array.isArray(data) && data.length) {
    setupD3(data, container);
  }
};

export default chart;
