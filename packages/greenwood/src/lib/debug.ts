const DEBUG: boolean = false;
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}
const fileDebug: Record<string, boolean> = {
  "/components/FanFiction/Harry_Potter_-_Nephilim/Appendices/PowerLevelTable.ts":
    false,
  "/components/GlobalFooter.ts": false,
  "/components/SiteTitle.ts": false,
  "/components/ThemeSelector.ts": false,
  "/components/TopHeader.ts": false,
  "/components/grampsParser/AncestorsTreeChart/AncestorsTree.ts": false,
  "/components/grampsParser/AncestorsTreeChart/DotChart.ts": false,
  "/components/grampsParser/AncestorsTreeChart/SVGChart.ts": false,
  "/components/grampsParser/AncestorsTreeChart/TreeChart.ts": false,
  "/components/grampsParser/AncestorsTreeChart/TreePerson.ts": false,
  "/components/grampsParser/Family.ts": false,
  "/components/grampsParser/FamilyListing.ts": false,
  "/components/grampsParser/GeneologicalStats.ts": false,
  "/components/grampsParser/Individual.ts": false,
  "/components/grampsParser/IndividualName.ts": false,
  "/components/grampsParser/event.ts": false,
  "/components/grampsParser/genealogical-data.ts": false,
  "/components/grampsParser/state.ts": false,
  "/components/side-nav.ts": false,
  "/components/theme.ts": false,
  "/components/v-timeline.ts": false,

  "/layouts/Bookmarks.ts": false,
  "/lib/BookmarksList.ts": false,
  "/lib/GedcomConstants.ts": false,
  "/lib/Spectrum/SplitView.ts": false,
  "/lib/TimelineTypes.ts": false,
  "/lib/customMarkdownProcessing.ts": false,
  "/lib/debug.ts": false,
  "/lib/greenwoodPages.ts": false,
  "/lib/topLevelSections.ts": false,
  "/pages/Bookmarks/Anti-Hermione.ts": false,
  "/pages/Bookmarks/Dealing%20With%20Snape/After%20He%20Dies.ts": false,
  "/pages/Bookmarks/Dealing%20With%20Snape/His%20Relationship%20With%20Lily.ts":
    false,
  "/pages/Bookmarks/Featuring%20Hermione.ts": false,
  "/pages/Bookmarks/Featuring%20Ron.ts": false,
  "/pages/Bookmarks/Fred%20and%20George.ts": false,
  "/pages/Bookmarks/Harry%20Leaves.ts": false,
  "/pages/Bookmarks/Luna.ts": false,
  "/pages/Bookmarks/Prequels.ts": false,
  "/pages/Bookmarks/Problems%20After%20the%20War.ts": false,
  "/pages/Bookmarks/Problems%20Exposed.ts": false,
  "/pages/Bookmarks/Responsible%20Adults.ts": false,
  "/pages/Bookmarks/The%20Missed%20Birthday.ts": false,
  "/pages/Bookmarks/Time%20Travel.ts": false,
  "/pages/Bookmarks/pairing/Harry/With%20Astoria.ts": false,
  "/pages/Bookmarks/pairing/Harry/With%20Daphne.ts": false,
  "/pages/Bookmarks/pairing/Harry/With%20Gabrielle.ts": false,
  "/pages/Bookmarks/pairing/Harry/With%20Ginny.ts": false,
  "/pages/Bookmarks/pairing/Harry/With%20Hannah.ts": false,
  "/pages/Bookmarks/pairing/Harry/With%20Sally-Anne.ts": false,
  "/pages/Bookmarks/pairing/Harry/With%20Su%20Li.ts": false,
  "/pages/Bookmarks/pairing/Harry/With%20Susan.ts": false,
  "/pages/Bookmarks/pairing/Harry/With%20Wednesday.ts": false,
  "/pages/Harrypedia/History.ts": false,
  "/pages/api/gedcom/event.ts": false,
  "/pages/api/gedcom/events.ts": false,
  "/pages/api/gedcom/families.ts": false,
  "/pages/api/gedcom/family.ts": false,
  "/pages/api/gedcom/people.ts": false,
  "/pages/api/gedcom/person.ts": false,
  "/plugins/gramps/families.ts": false,
  "/plugins/gramps/people.ts": false,
  "/schemas/bookmarks.ts": false,
  "/schemas/event.ts": false,
  "/schemas/gedcom/event.ts": false,
  "/schemas/gedcom/family.ts": false,
  "/schemas/gedcom/index.ts": false,
  "/schemas/gedcom/person.ts": false,
  "/schemas/gedcom/tags.ts": false,
  "/schemas/history.ts": false,
  "/schemas/index.ts": false,
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
