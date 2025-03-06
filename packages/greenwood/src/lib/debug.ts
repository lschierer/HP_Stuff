const DEBUG: boolean = false;
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}
const fileDebug: Record<string, boolean> = {
  "/lib/debug.ts": false,
  "/lib/BookmarksList.ts": false,
  "/components/DirectoryIndex.ts": false,
  "/components/theme.ts": false,
  "/components/SiteTitle.ts": false,
  "/components/grampsParser/GeneologicalStats.ts": false,
  "/components/grampsParser/event.ts": false,
  "/components/grampsParser/Family.ts": false,
  "/components/grampsParser/FamilyListing.ts": false,
  "/components/grampsParser/Individual.ts": false,
  "/components/grampsParser/IndividualName.ts": false,
  "/components/grampsParser/Family.ts.1": false,
  "/components/grampsParser/Family.ts.2": false,
  "/components/ThemeSelector.ts": false,
  "/pages/Bookmarks/ResponsibleAdults.ts": false,
  "/pages/Bookmarks/Dealing%20With%20Snape/After%20He%20Dies.ts": false,
  "/pages/Harrypedia/History.ts": false,
  "/pages/Harrypedia/History.ts.1": false,
  "/pages/Harrypedia/History.ts.2": false,
  "/components/v-timeline.ts": false,
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
