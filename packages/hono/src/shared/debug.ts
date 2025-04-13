const DEBUG: boolean = false;
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}
const fileDebug: Record<string, boolean> = {
  "/Pages/Harrypedia/History.ts": false,
  "/client/ThemeSelector.ts": false,
  "/client/entry-client.ts": false,
  "/client/scale-medium.ts": false,
  "/client/theme-dark.ts": false,
  "/client/theme-light.ts": false,
  "/client/theme.ts": false,
  "/schemas/bookmarks.ts": false,
  "/schemas/event.ts": false,
  "/schemas/gedcom/event.ts": false,
  "/schemas/gedcom/family.ts": false,
  "/schemas/gedcom/index.ts": false,
  "/schemas/gedcom/person.ts": false,
  "/schemas/gedcom/tags.ts": false,
  "/schemas/history.ts": false,
  "/schemas/index.ts": false,
  "/schemas/page.ts": false,
  "/scripts/build-client.ts": false,
  "/scripts/gedcomExportToHtml.ts": false,
  "/server/FanFiction.ts": false,
  "/server/FooterSection.ts": false,
  "/server/Harrypedia.ts": true,
  "/server/SSRUtils.ts": true,
  "/server/TopHeader.ts": false,
  "/server/layout.ts": true,
  "/server/mdTohtml.ts": true,
  "/server/server.ts": true,
  "/shared/app.ts": false,
  "/shared/config.ts": false,
  "/shared/debug.ts": false,
  "/shared/gedcom/GedcomConstants.ts": false,
  "/shared/gedcom/IndividualName.ts": false,
  "/shared/gedcom/state.ts": false,
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
