import { createContext } from "@lit/context";

import * as GrampsZod from "../../lib/GrampsZodTypes.ts";

export const DEBUG = true;

export class GrampsState {
  public primaryId: string | null = null;
  public familyName: string | null = null;
  public zodData: GrampsZod.Database | null = null;

  public async fetchData(dbUrl: URL) {
    if (DEBUG)
      console.log(`fetchData onSet task; dbUrl is ${dbUrl.toString()}`);
    const response = await fetch(dbUrl);
    const data = await response.json();
    const validation = GrampsZod.Database.safeParse(data);
    if (validation.success) {
      if (DEBUG) {
        console.log(`validation successful`);
        console.log(`retrieved data: `);
        console.log(`${validation.data.people.person.length} people`);
        console.log(`${validation.data.families.family.length} familes`);
      }

      this.zodData = validation.data;
      return true;
    } else {
      if (DEBUG) {
        console.log(`validation failed: ${validation.error.message}`);
      }
    }
    return false;
  }
}

export const grampsContext = createContext<GrampsState>("state");
