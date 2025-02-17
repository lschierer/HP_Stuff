import { CardGrid } from "./card-grid.ts";

const DEBUG = 0;

export default class SplashCardGrid extends CardGrid {
  constructor() {
    super();
    if (DEBUG) {
      console.log(`SplashCardGrid constructor`);
    }
    this.gridCards = [
      {
        title: "Generals",
        name: "healthicons:officer-outline",
        description: "All about picking generals.",
      },
      {
        title: "Monsters",
        name: "game-icons:fish-monster",
        description: "All about hunting monsters.",
      },
      {
        title: "PvP",
        name: "mdi:sword-fight",
        description: "All about participating in PvP.",
      },
      { title: "Reference", name: "ion:library-outline" },
    ];
  }
}
customElements.define("splash-cardgrid", SplashCardGrid);
