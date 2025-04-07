/* TODO could this just be an S3 bucket? */

export const frontend = new sst.aws.StaticSite("HPStuff_Static", {
  path: "./",
  build: {
    command: "just build",
    output: "public",
  },

  // access: "cloudfront"
});
