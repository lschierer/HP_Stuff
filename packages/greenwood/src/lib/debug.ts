import path from "node:path";
import process from "node:process";

const fileDebug: Record<string, boolean> = {
  "/lib/debug.ts": false,
  "/lib/BookmarksList.ts": true,
  "/components/DirectoryIndex.ts": false,
  "/components/theme.ts": false,
  "/components/SiteTitle.ts": false,
  "/components/ThemeSelector.ts": false,
  "/pages/Bookmarks/ResponsibleAdults.ts": true,
};

const debugFunction = (myName: string): boolean => {
  if (path.isAbsolute(myName)) {
    myName = `/${path.relative(`${process.cwd()}/src`, myName)}`;
  }
  return fileDebug[myName];
};

export default debugFunction;
