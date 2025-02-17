import { z } from "zod";
import { GedcomFamily } from "../../../schemas/gedcom/index.ts";
export async function handler(request: Request) {
  const params = new URLSearchParams(
    request.url.slice(request.url.indexOf("?"))
  );
  const id = params.has("id") ? params.get("id") : "";

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
  if (families && families.length > 0 && id) {
    const family = families.find((f) => {
      return !f.id.localeCompare(id);
    });
    if (family) {
      body = family;
    }
  }

  return new Response(JSON.stringify(body), {
    headers: new Headers({
      "Content-Type": "application/json",
    }),
  });
}
