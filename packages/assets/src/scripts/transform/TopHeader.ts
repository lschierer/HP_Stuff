import { fileURLToPath } from "node:url";
import * as fs from "node:fs";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import { visit } from "unist-util-visit";
import type { Element, Root } from "hast";

import debugFunction from "@shared/debug";
const DEBUG = debugFunction(new URL(import.meta.url).pathname);

import { LocalConfig } from "../../shared/localConfig";

export default class TopHeaderSection {
  accessor route: string = "";

  private getNavSection = () => {
    return LocalConfig && LocalConfig.TOPLEVELSECTIONS.length
      ? LocalConfig.TOPLEVELSECTIONS.map((section) => {
          if (this.route.startsWith(`/${section.replaceAll(" ", "")}`)) {
            return `
              <div class="navItem">
                <span class="spectrum-Heading spectrum-Heading--serif spectrum-Heading--sizeXS">${section.replaceAll("_", " ")}</span>
              </div>
              `;
          } else {
            return `
              <div class="navItem">
                <a
                  href=${"/" + section.replaceAll(" ", "") + "/"}
                  class="spectrum-Link spectrum-Link--primary spectrum-Link--quiet"
                >
                  <span class="spectrum-Heading spectrum-Heading--serif spectrum-Heading--sizeXS">${section.replaceAll("_", " ")}</span>
                </a>
              </div>
            `;
          }
        }).join("")
      : "";
  };

  private getSvgLogo = (logoPath: string) => {
    const myLogoURL = new URL(`../assets/${logoPath}`, import.meta.url);
    if (DEBUG) {
      console.log(`myLogoURL is ${myLogoURL}`);
    }
    const myLogoPath = fileURLToPath(myLogoURL);
    if (DEBUG) {
      console.log(`myLogoPath is ${myLogoPath}`);
    }
    const myLogo = fs.readFileSync(myLogoPath, "utf-8");
    return `
      <div class=" site-logo spectrum-Heading spectrum-Heading--sizeXXL">
        ${myLogo}
      </div>
    `;
  };

  private getImgLogo = (logoPath: string, altText: string) => {
    return `
      <img
        alt=${altText}
        src=${logoPath}
      />
    `;
  };

  private getSiteTitle = () => {
    const siteTitle =
      LocalConfig && LocalConfig.SITETITLE ? LocalConfig.SITETITLE : "";
    if (DEBUG) {
      console.log(`siteTitle is ${siteTitle}`);
    }
    const siteLogo =
      LocalConfig && LocalConfig.SITELOGO
        ? LocalConfig.SITELOGO.endsWith(".svg")
          ? this.getSvgLogo(LocalConfig.SITELOGO)
          : this.getImgLogo(LocalConfig.SITELOGO, siteTitle)
        : "";

    return `
      <a href='/' class="site-title spectrum-Link spectrum-Link--quiet spectrum-Link--secondary">
        <span class=" site-title spectrum-Heading spectrum-Heading--sizeXS">
          ${siteLogo}
        </span>
      </a>
      <a href='/' class="site-title spectrum-Link spectrum-Link--quiet spectrum-Link--secondary">
        <span class="site-title spectrum-Heading spectrum-Heading--sizeXL">
          ${siteTitle}
        </span>
      </a>
    `;
  };

  private getSection = () => {
    return `
      <div class="header">
        <div class="site-title-section">
          ${this.getSiteTitle()}
        </div>
        <div class="nav">
          ${this.getNavSection()}
        </div>
        <div class=" right-group">
          <div class=" social-icons">
            <SocialIcons {...Astro.props} ></SocialIcons>
          </div>
          <theme-select></theme-select>
        </div>
      </div>

    `;
  };

  readonly shouldIntercept = (request: Request) => {
    return !request.url.startsWith("/api/");
  };

  readonly intercept = (doc: Root) => {
    if (DEBUG) {
      console.log(`TopHeaderSection intercept start`);
    }
    const topHeaderSection = this.getSection();

    visit(doc, "element", (node: Element) => {
      if (node.tagName === "head") {
        if (DEBUG) {
          console.log(`found head tag`);
        }
        node.children.push({
          type: "element",
          tagName: "link",
          properties: {
            href: "/styles/TopHeader.css",
            rel: "stylesheet",
          },
          children: [],
        });
        node.children.push({
          type: "element",
          tagName: "link",
          properties: {
            href: "/styles/SiteTitle.css",
            rel: "stylesheet",
          },
          children: [],
        });
        node.children.push({
          type: "element",
          tagName: "script",
          properties: {
            src: "/client/ThemeSelector.js",
            type: "module",
          },
          children: [],
        });
      }
    });

    visit(doc, "element", (node: Element) => {
      if (
        node.tagName === "div" &&
        node.properties.className &&
        Array.isArray(node.properties.className) &&
        node.properties.className.includes("topHeader")
      ) {
        const tempTree = unified()
          .use(rehypeParse, { fragment: true })
          .parse(topHeaderSection);

        const en = tempTree.children.filter(
          (child) => child.type === "element"
        );
        node.children = en;
      }
    });
  };
}
