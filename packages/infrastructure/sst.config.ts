/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "HP-Stuff",
      removal: input.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input.stage),
      home: "aws",
      providers: {
        aws: {
          region: "us-east-2",
          profile: "home",
        },
      },
    };
  },
  async run() {
    await import("./index");
  },
});
