import { type Page, sortPages } from "../lib/greenwoodPages.ts";

import {
  getContentByRoute,
  //@ts-expect-error
} from "@greenwood/cli/src/data/client.js";

import { TopLevelSections } from "../lib/topLevelSections.ts";
//@ts-expect-error
import SpectrumSideNav from "@spectrum-css/sidenav" with { type: "css" };
import "@spectrum-web-components/theme/src/themes-core-tokens.js";
import "@spectrum-web-components/sidenav/sp-sidenav.js";
import "@spectrum-web-components/sidenav/sp-sidenav-heading.js";
import "@spectrum-web-components/sidenav/sp-sidenav-item.js";

const DEBUG = false;

interface PageAndChildren {
  p: Page;
  c: Page[] | undefined;
}

export default class SideNav extends HTMLElement {
  private route: string = "";
  private topSection: TopLevelSections | undefined = undefined;

  private async findPageAndChildren(route: string): Promise<PageAndChildren> {
    if (DEBUG) {
      console.log(`findPageAndChildren for ${route}`);
    }
    const rs = await getContentByRoute(route);
    const p = rs.find((p: Page) => {
      return !p.route.toString().localeCompare(route);
    });
    const c = rs.filter((p: Page) => {
      return p.route.toString().localeCompare(route);
    });
    return { p, c };
  }

  private buildTreeForRoute(thisPage: Page, otherPages?: Page[]): string {
    const route = thisPage.route.toString();
    if (DEBUG) {
      console.log(`buildTreeForRoute for route ${route}`);
    }
    const tlsPages = otherPages ? otherPages : new Array<Page>();
    let directory = false;
    const children = new Array<string>();
    if (tlsPages.length) {
      if (DEBUG) {
        console.log(`${route} has ${tlsPages.length} pages`);
      }
      directory = true;
      tlsPages
        .sort((a, b) => sortPages(a, b))
        .map((p) => {
          if (!p.route.toString().localeCompare(thisPage.route.toString())) {
            if (DEBUG) {
              console.log(`other pages has parent page!!!`);
              return;
            }
          }
          if (DEBUG) {
            console.log(`checking decendant ${p.route}`);
          }
          const r = p.route.toString();
          const s = r.split("/").length;
          const validChildStack = route.split("/").length + 2;
          if (s > 0 && s < validChildStack) {
            if (DEBUG) {
              console.log(`decendant ${p.route} is a child`);
            }
            const c = tlsPages.filter((tp) => {
              return (
                tp.route.toString().startsWith(r) &&
                tp.route.toString().localeCompare(r)
              );
            });

            const childTree = this.buildTreeForRoute(p, c);
            if (childTree !== undefined && childTree.length > 0) {
              children.push(childTree);
            }
          } else {
            if (DEBUG) {
              console.log(
                `rejected decendant ${p.route} because s is ${s} compared to ${validChildStack}`,
              );
            }
          }
        });
    } else {
      if (DEBUG) {
        console.log(`${route} has no pages`);
      }
    }

    if (tlsPages.length > 0) {
      if (DEBUG) {
        console.log(`detected ${tlsPages.length} other pages for ${route}`);
      }
    }
    if (thisPage === undefined) {
      if (DEBUG) {
        console.log(`cound not find page for ${route}`);
      }
      return "";
    } else {
      const ct = children.length ? children.join(" ") : "";
      const expanded = children.length
        ? this.route.startsWith(thisPage.route.toString())
          ? "expanded"
          : " "
        : "";
      const selected = !this.route.localeCompare(thisPage.route.toString())
        ? "selected"
        : "";
      return `
        <sp-sidenav-item
          value="${thisPage.route}"
          href="${thisPage.route}"
          label="${decodeURIComponent(thisPage.title ? thisPage.title.toString() : thisPage.label.toString().replaceAll("_", " "))}"
          ${expanded}
          ${selected}
        >
          <iconify-icon
            icon=${directory ? "lsicon:folder-filled" : "ep:document"}
            class="spectrum-Icon spectrum-Icon--sizeM"
            slot="icon"
          ></iconify-icon>
          ${ct}
          <!-- ${directory ? "this was detected as a directory" : "this was not detected as a directory"} -->
          <!-- ${thisPage.route.startsWith(this.route) ? `${thisPage.route} starts with ${this.route}` : `${thisPage.route} unique from ${this.route}}`} -->
        </sp-sidenav-item>
      `;
    }
  }

  private async buildTree() {
    const templates = new Array<string>();
    const tls = `/${this.topSection?.replaceAll(" ", "")}/`;
    const topChildren = (await this.findPageAndChildren(tls)).c;
    if (!topChildren) {
      if (DEBUG) {
        console.log(`no children found for tls ${tls}`);
      }
      return "";
    } else {
      if (DEBUG) {
        console.log(
          `found topChildren, ${topChildren ? topChildren.length : 0} pages for ${tls}`,
        );
      }
      await Promise.all(
        topChildren
          .filter((child) => {
            const r = child.route.toString();
            const s = r.split("/").length;
            return s > 0 && s < 5;
          })
          .sort((a, b) => sortPages(a, b))
          .map(async (child) => {
            if (DEBUG) {
              console.log(`tree for ${child.route}`);
            }
            const childAsRoute = child.route.toString();
            const grandkids = (await this.findPageAndChildren(childAsRoute)).c;

            const tlsTemplate = this.buildTreeForRoute(child, grandkids);
            if (tlsTemplate.length > 0) {
              templates.push(tlsTemplate);
            }
          }),
      );
    }

    if (DEBUG) {
      console.log(`at end I have ${templates.length} templates in the array`);
    }
    return templates.join(" ");
  }

  async connectedCallback() {
    const _changedProperties = this.getAttributeNames();
    if (_changedProperties.includes("route")) {
      this.route = this.getAttribute("route") ?? "";
    }
    TopLevelSections.options.map((section) => {
      const r = `/${section.replace(" ", "")}/`;
      if (this.route.startsWith(r)) {
        this.topSection = section;
      }
    });
    if (DEBUG) {
      console.log(`found topSection ${this.topSection}`);
    }
    const tree = await this.buildTree();
    const navHeading =
      this.topSection !== undefined
        ? `<span class="spectrum-Heading spectrum-Heading--sizeS ">${this.topSection}</span>`
        : ";";
    this.innerHTML = `
      ${navHeading}
      <sp-sidenav  manage-tab-index variant="multilevel" defaultValue="${this.route}">
        ${tree}
      </sp-sidenav>
    `;
  }
}
customElements.define("side-nav", SideNav);
