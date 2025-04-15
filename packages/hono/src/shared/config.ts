import { z } from "zod";

export const Config = z.object({
  SITETITLE: z
    .string()
    .min(3)
    .describe(
      "this is a human-consuable string that will be used as the title on the default landing page and in the top Header)"
    ),
  SITELOGO: z
    .string()
    .optional()
    .describe(
      'this should contain the path, including the filename, to the logo file rooted in the Greenwood assets directory. If your asset directory is $assetDir, and your logo file is `$assetDir/myLogo.svg` then you would put "myLogo.svg" here. '
    ),
  SITELOGOALTTEXT: z
    .string()
    .optional()
    .describe("any alt text that should be used for the logo image."),
  TOPLEVELSECTIONS: z
    .string()
    .describe(
      "this should contain an a comma separated list of strings that will form the main/top level sections for the site.  Thesse will appear in the top navigation section as well as the side navigations section."
    ),
  PRIVACYPOLICY: z
    .union([z.string(), z.literal("false"), z.literal(false)])
    .describe(
      "a path, within the site, to the privacy policy, or false to indicate no policy is present for this site."
    ),
  AUTHORS: z
    .union([z.literal("git"), z.string().array()])
    .describe(
      'either an array of strings, with each string being an author of the site, or the single string constant "git" to indicate that the authors should be extracted from git.'
    ),
  REPO: z.string().url().describe("the URL of your git repository"),
  BRANCH: z
    .string()
    .default("main")
    .optional()
    .describe('the branch of the repository if not "main"'),
});
export type Config = z.infer<typeof Config>;
