const fileDebug: Record<string, boolean> = {
  "/lib/debug.ts": false,
  "/components/DirectoryIndex.ts": false,
  "/components/theme.ts": false,
  "/components/SiteTitle.ts": false,
  "/components/ThemeSelector.ts": false,
};

const debugFunction = (myName: string): boolean => {
  return fileDebug[myName];
};

export default debugFunction;
