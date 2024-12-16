export const prerender = false;
import { customElement } from "lit/decorators.js";

import { CardGrid } from "./card-grid.ts";

@customElement("top-cardgrid")
export default class TopCardGrid extends CardGrid {
  public constructor() {
    super();
    this.gridCards = [
      {
        title: "Encyclopedic Reference",
        target: "Harrypedia",
        description: "My notes and speculation about the series",
        name: "hugeicons:books-01",
      },
      {
        title: "Searches",
        name: "game-icons:magnifying-glass",
        description:
          "Links to saved searches for various collections of fan fiction",
      },
      {
        title: "Bookmarks",
        target: "BookMarks",
        name: "game-icons:bookmark",
        description:
          "Bookmarks for works I find particularly memorable, worth re-reading, the source of good ideas, or want to keep track of for some other reason",
      },
      {
        title: "Fan Fiction",
        target: "FanFiction",
        description:
          "Self-hosted fan fiction. Largely incomplete, probably never to be completed, but satisfying an occasional itch.",
        name: "system-uicons:book-text",
      },
    ];
  }
}
