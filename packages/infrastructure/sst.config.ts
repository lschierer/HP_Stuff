export default $config({
  app(input) {
    return {
      name: "hpstuff",
      removal: input.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input.stage),
      home: "aws",
      region: "us-east-2",
    };
  },
  async run() {
    await import("./router.ts");
  },
});
