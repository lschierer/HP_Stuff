const DEBUG: boolean = false;
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (DEBUG) {
  console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}
const fileDebug: Record<string, boolean> = {
  "/components/MathRunner.ts": false,
  "/counter.ts": false,
  "/lib/debug.ts": false,
  "/lib/grampsState.ts": false,
  "/main.ts": false,
  "/plugins/gramps.ts": false,
  "/schemas/bookmarks.ts": false,
  "/schemas/event.ts": false,
  "/schemas/gedcom/event.ts": false,
  "/schemas/gedcom/family.ts": false,
  "/schemas/gedcom/index.ts": false,
  "/schemas/gedcom/person.ts": false,
  "/schemas/gedcom/tags.ts": false,
  "/schemas/history.ts": false,
  "/schemas/index.ts": false,
  "/vite-env.d.ts": false,
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
