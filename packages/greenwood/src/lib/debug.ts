const DEBUG: boolean = false;
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}
const fileDebug: Record<string, boolean> = {
  "/components/DirectoryIndex.ts": false,
  "/components/FanFiction/Harry_Potter_-_Nephilim/Appendices/PowerLevelTable.ts":
    false,
  "/components/SideBar.ts": false,
  "/components/Spectrum/Base.ts": false,
  "/components/Spectrum/SplitView.ts": false,
  "/components/Spectrum/scale-medium.ts": false,
  "/components/Spectrum/theme-dark.ts": false,
  "/components/Spectrum/theme-light.ts": false,
  "/components/ThemeSelector.ts": false,
  "/components/TreeChartDisplay.ts": false,
  "/components/grampsParser/AncestorsTreeChart/AncestorsTree.ts": false,
  "/components/grampsParser/Family.ts": false,
  "/components/grampsParser/FamilyListing.ts": false,
  "/components/grampsParser/FamilyPageSection.ts": false,
  "/components/grampsParser/GeneologicalStats.ts": false,
  "/components/grampsParser/Individual.ts": false,
  "/components/grampsParser/IndividualName.ts": false,
  "/components/grampsParser/PersonPageSection.ts": false,
  "/components/grampsParser/event.ts": false,
  "/components/grampsParser/genealogical-data.ts": false,
  "/components/grampsParser/state.ts": false,
  "/components/v-timeline.ts": false,
  "/layouts/_standard.ts": false,
  "/layouts/HPNOFP": true,
  "/layouts/transforms/DirectoryIndex.ts": false,
  "/lib/BookmarksList.ts": false,
  "/lib/GedcomConstants.ts": false,
  "/lib/HPNOFPtemplate.ts": false,
  "/lib/Spectrum/SplitView.ts": false,
  "/lib/customMarkdownProcessing.ts": false,
  "/lib/debug.ts": false,
  "/lib/greenwoodPages.ts": false,
  "/lib/staticConfig.ts": false,
  "/pages/Bookmarks/Anti-Dumbledore.ts": false,
  "/pages/Bookmarks/Anti-Hermione.ts": false,
  "/pages/Bookmarks/Dealing_With_Snape/After_He_Dies.ts": false,
  "/pages/Bookmarks/Dealing_With_Snape/His_Relationship_With_Lily.ts": false,
  "/pages/Bookmarks/Featuring_Hermione.ts": false,
  "/pages/Bookmarks/Featuring_Ron.ts": false,
  "/pages/Bookmarks/Fred_and_George.ts": false,
  "/pages/Bookmarks/Harry_Leaves.ts": false,
  "/pages/Bookmarks/Luna.ts": false,
  "/pages/Bookmarks/Prequels.ts": false,
  "/pages/Bookmarks/Problems_After_the_War.ts": false,
  "/pages/Bookmarks/Problems_Exposed.ts": false,
  "/pages/Bookmarks/Responsible_Adults.ts": false,
  "/pages/Bookmarks/The_Missed_Birthday.ts": false,
  "/pages/Bookmarks/Time_Travel.ts": false,
  "/pages/Bookmarks/pairing/With_Astoria.ts": false,
  "/pages/Bookmarks/pairing/With_Daphne.ts": false,
  "/pages/Bookmarks/pairing/With_Gabrielle.ts": false,
  "/pages/Bookmarks/pairing/With_Ginny.ts": false,
  "/pages/Bookmarks/pairing/With_Hannah.ts": false,
  "/pages/Bookmarks/pairing/With_Sally-Anne.ts": false,
  "/pages/Bookmarks/pairing/With_Su_Li.ts": false,
  "/pages/Bookmarks/pairing/With_Susan.ts": false,
  "/pages/Bookmarks/pairing/With_Wednesday.ts": false,
  "/pages/Harrypedia/History.ts": false,
  "/pages/api/gedcom/event.ts": false,
  "/pages/api/gedcom/events.ts": false,
  "/pages/api/gedcom/families.ts": false,
  "/pages/api/gedcom/family.ts": false,
  "/pages/api/gedcom/people.ts": false,
  "/pages/api/gedcom/person.ts": false,
};

function isAbsolutePath(path: string): boolean {
  // Check for Unix-style absolute paths (starts with `/`)
  if (path.startsWith("/")) return true;

  // Check for Windows-style absolute paths (e.g., `C:\Users\Example`)
  if (/^[a-zA-Z]:[\\/]/.test(path)) return true;

  // Check for absolute URLs
  try {
    new URL(path);
    return true;
  } catch {
    return false;
  }
}

const debugFunction = (myName: string): boolean => {
  if (isAbsolutePath(myName)) {
    let root = "";

    const rootStack = new URL(import.meta.url).pathname.split("/");
    root = rootStack.slice(0, -2).join("/");

    myName = myName.replace(root, "");
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (DEBUG) {
      console.log(`new name is ${myName}, root was ${root}`);
    }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (DEBUG) {
      console.log(`got path ${myName}`);
    }
  }
  return fileDebug[myName];
};

export default debugFunction;
