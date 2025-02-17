const fileDebug: Record<string, boolean> = {
  "/lib/debug.ts": true,
  "/components/theme.ts": true,
  "/components/SiteTitle.ts": true,
};

const debugFunction = (myName: string): boolean => {
  return fileDebug[myName];
};

export default debugFunction;
