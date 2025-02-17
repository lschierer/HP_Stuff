import { z } from "zod";
import { GedcomFamily } from "../../../schemas/gedcom/index.ts";
export async function handler(request: Request) {
  const familiesImport = await import("../../../assets/gedcom/families.json");
  const valid = z
    .array(GedcomFamily.GedcomElement)
    .safeParse(familiesImport.default);
  if (valid.success) {
    console.log(`successful parse`);
  } else {
    console.error(valid.error.message);
  }
  const families = valid.data;
  let body: GedcomFamily.GedcomElement | Object = {};
  if (families && families.length > 0) {
    body = families;
  }

  return new Response(JSON.stringify(body), {
    headers: new Headers({
      "Content-Type": "application/json",
    }),
  });
}
