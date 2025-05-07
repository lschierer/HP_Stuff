import "@spectrum-web-components/split-view/sp-split-view.js";
import SideBarCSS from "@hp-stuff/assets/dist/styles/sidebar.css" with { type: "css" };
if (document.querySelector(".spectrum-SideNav")) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, SideBarCSS];
}
