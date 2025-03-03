---
interface Props {
  familyHandle: string;
  fatherHandle?: string;
  motherHandle?: string;
  childrenHandles?: string[];
  tree?: boolean;
}

import { GedcomPerson, GedcomFamily } from "@schemas/gedcom";
import { getCollection, type CollectionEntry } from "astro:content";

import "@styles/Gramps.css";
import { ChildRef } from "@schemas/gedcom/family";

import IndividualName from "./IndividualName.astro";
import Event from "./event.astro";

const DEBUG = false;
const DEBUG1 = false;
const DEBUG2 = false;

const {
  familyHandle,
  fatherHandle = "",
  motherHandle = "",
  childrenHandles = new Array<string>(),
  tree = false,
} = Astro.props;

let displayAsParent = false;
if (DEBUG) {
  console.log(`props are ${JSON.stringify(Astro.props)}`);
}
if (
  (fatherHandle.length > 0 || motherHandle.length > 0) &&
  childrenHandles.length == 0
) {
  displayAsParent = true;
  if (DEBUG) {
    console.log(`displaying as parent`);
  }
} else {
  if (DEBUG) {
    console.log(`displaying as child`);
  }
}
let father: GedcomPerson.GedcomElement | undefined = undefined;
let mother: GedcomPerson.GedcomElement | undefined = undefined;
let fID: string = "";
let mID: string = "";
const feventRefs: GedcomPerson.EventRef[] = new Array<GedcomPerson.EventRef>();
const meventRefs: GedcomPerson.EventRef[] = new Array<GedcomPerson.EventRef>();
let fBirthIndex = -1;
let fDeathIndex = -1;
let mBirthIndex = -1;
let mDeathIndex = -1;

const siblings = new Array<GedcomPerson.GedcomElement>();

const entries = await getCollection("families", ({ data }) => {
  if (DEBUG1) {
    console.log(`testing ${data.id}`);
  }
  if (data.handle.localeCompare(familyHandle)) {
    if (DEBUG1) {
      console.log(`handle mismatch, do not bother.`);
    }
    return false;
  }
  if (fatherHandle.length > 0) {
    if (data.father_handle == undefined) {
      if (DEBUG1) {
        console.log(`father mismatch: data.father_handle undefined`);
      }
      return false;
    } else if (fatherHandle.localeCompare(data.father_handle)) {
      if (DEBUG1) {
        console.log(
          `father mismatch: ${data.father_handle} != ${fatherHandle}`
        );
      }
      return false;
    } else {
      if (DEBUG1) {
        console.log(`father match: ${data.father_handle} == ${fatherHandle}`);
      }
    }
  }
  if (motherHandle.length > 0) {
    if (data.mother_handle == undefined) {
      if (DEBUG1) {
        console.log(`mother mismatch: data.mother_handle undefined`);
      }
      return false;
    } else if (motherHandle.localeCompare(data.mother_handle)) {
      if (DEBUG1) {
        console.log(
          `mother mismatch: ${data.mother_handle} != ${motherHandle}`
        );
      }
      return false;
    } else {
      if (DEBUG1) {
        console.log(`mother match: ${data.mother_handle} == ${motherHandle}`);
      }
    }
  }
  if (
    childrenHandles != undefined &&
    Array.isArray(childrenHandles) &&
    childrenHandles.length > 0
  ) {
    if (
      data.child_ref_list != undefined &&
      Array.isArray(data.child_ref_list) &&
      data.child_ref_list.length > 0
    ) {
      const entryChildren: string[] = new Array<string>();
      data.child_ref_list.map((childref) => {
        const cr = childref.ref;
        entryChildren.push(cr);
      });
      const cm = !childrenHandles
        .map((ch) => {
          if (!entryChildren.includes(ch)) {
            if (DEBUG2) {
              console.log(
                `${ch} is not in ${JSON.stringify(entryChildren.join(" "))}`
              );
            }
            return false;
          }
          return true;
        })
        .includes(false);
      if (cm == true && DEBUG1) {
        console.log(
          `children match: ${cm}: ${JSON.stringify(childrenHandles.join(" "))}; ${entryChildren.join(" ")}`
        );
      }
      return cm;
    } else {
      if (DEBUG2) {
        console.log(
          `looking for a family with ${childrenHandles.length} children, this entry has no children`
        );
      }
      return false;
    }
    return data.type.string
      ? !data.type.string.localeCompare(GedcomFamily.StringEnum.Values.Birth)
      : false;
  } else {
    if (DEBUG2) {
      console.log(`no children to match against`);
    }
  }
  if (DEBUG1) {
    console.log(`returning true for ${data.id}`);
  }
  return true;
});

if (!Array.isArray(entries) || entries.length == 0) {
  console.error(`no family found with props ${JSON.stringify(Astro.props)}`);
} else {
  if (DEBUG) {
    console.log(`searching for parents for in Family.astro`);
  }

  await Promise.all(
    entries.map(async (entry) => {
      const data = entry.data;
      if (data.father_handle != undefined) {
        if (DEBUG) {
          console.log(`father is defined`);
        }
        const fHandle = data.father_handle;
        const fes = await getCollection("people", ({ data }) => {
          return !data.handle.localeCompare(fHandle);
        });
        if (Array.isArray(fes) && fes.length > 0) {
          if (DEBUG) {
            console.log(`found ${fes.length} potential fathers`);
          }
          if (fes.length > 1) {
            console.error(`found too many fathers: ${fes.length}`);
            throw new Error(`found too many fathers: ${fes.length}`);
          } else {
            father = fes[0].data;
            fID = father.id;
            if (father.event_ref_list.length > 0) {
              feventRefs.push(...father.event_ref_list);
            }
            fBirthIndex = father.birth_ref_index;
            fDeathIndex = father.death_ref_index;
            if (DEBUG) {
              console.log(`fID is ${fID}`);
            }
          }
        }
      }
      if (data.mother_handle != undefined) {
        if (DEBUG) {
          console.log(`mother is defined`);
        }
        const mHandle = data.mother_handle;
        const mes = await getCollection("people", ({ data }) => {
          return !data.handle.localeCompare(mHandle);
        });
        if (Array.isArray(mes) && mes.length > 0) {
          if (DEBUG) {
            console.log(`found ${mes.length} potential mothers`);
          }
          if (mes.length > 1) {
            console.error(`found too many mothers: ${mes.length}`);
            throw new Error(`found too many mothers: ${mes.length}`);
          } else {
            mother = mes[0].data;
            mID = mother.id;
            if (mother.event_ref_list.length > 0) {
              meventRefs.push(...mother.event_ref_list);
            }
            mBirthIndex = mother.birth_ref_index;
            mDeathIndex = mother.death_ref_index;
            if (DEBUG) {
              console.log(`mID is ${mID}`);
            }
          }
        }
      }

      if (data.child_ref_list.length > 0) {
        const childrefs = new Array<string>();
        data.child_ref_list.map((cref) => {
          if (
            (Array.isArray(childrenHandles) &&
              !childrenHandles?.includes(cref.ref)) ||
            displayAsParent
          ) {
            childrefs.push(cref.ref);
          }
        });
        const centries = await getCollection("people", ({ data }) => {
          return childrefs.includes(data.handle);
        });
        centries.map((ce) => {
          if (ce != undefined) {
            siblings.push(ce.data);
          }
        });
      } else {
        if (DEBUG && displayAsParent) {
          console.log(`no children present`);
        }
      }
    })
  );
}
if (DEBUG) {
  console.log(`fID is ${fID} at end`);
  if (feventRefs.length > 0) {
    console.log(
      `father's birth ref is ${fBirthIndex >= 0 ? feventRefs[fBirthIndex].ref : fBirthIndex}`
    );
    console.log(
      `father's death ref is ${fDeathIndex >= 0 ? feventRefs[fDeathIndex].ref : fDeathIndex} `
    );
  }
  console.log(`mID is ${mID} at end`);
  if (meventRefs.length > 0) {
    console.log(
      `mother's birth ref is ${mBirthIndex >= 0 && mBirthIndex < meventRefs.length ? meventRefs[mBirthIndex].ref : mBirthIndex}`
    );
    console.log(
      `mother's death ref is ${mDeathIndex >= 0 && mDeathIndex < meventRefs.length ? meventRefs[mDeathIndex].ref : mDeathIndex}`
    );
  }
}

siblings
  .sort((a, b) => {
    return a.id.localeCompare(b.id);
  })
  .sort((a, b) => {
    if (a.primary_name.first_name != undefined) {
      if (b.primary_name.first_name != undefined) {
        return a.primary_name.first_name.localeCompare(
          b.primary_name.first_name
        );
      } else {
        return 1;
      }
    } else if (b.primary_name.first_name != undefined) {
      return -1;
    } else {
      return 0;
    }
  });

if (DEBUG) {
  console.log(`displayAsParent is ${displayAsParent} at end`);
}
---

{
  Array.isArray(entries) && entries.length > 0 ? (
    <>
      <div class="Parents flex-auto flex-col my-0 gap-0">
        <h4 class="my-0">Parents (or Custiodial Guardians)</h4>
        <ul class="bio not-content">
          <li class="my-0">
            Father:
            {father != undefined ? (
              <span>
                <IndividualName inline={true} personId={fID} /> (
                {feventRefs.length > 0 &&
                fBirthIndex >= 0 &&
                fBirthIndex < feventRefs.length &&
                feventRefs[fBirthIndex].ref &&
                feventRefs[fBirthIndex].ref.length > 0 ? (
                  <Event handle={feventRefs[fBirthIndex].ref} />
                ) : (
                  "Unknown Birthday"
                )}{" "}
                -
                {feventRefs.length > 0 &&
                fDeathIndex >= 0 &&
                feventRefs[fDeathIndex].ref.length > 0 ? (
                  <Event handle={feventRefs[fDeathIndex].ref} />
                ) : (
                  "the Present?"
                )}{" "}
                )
              </span>
            ) : (
              <span> Unknown</span>
            )}
          </li>
          <li>
            Mother:
            {mother != undefined ? (
              <span>
                <IndividualName inline={true} personId={mID} /> (
                {meventRefs.length > 0 &&
                mBirthIndex >= 0 &&
                mBirthIndex < meventRefs.length &&
                meventRefs[mBirthIndex].ref &&
                meventRefs[mBirthIndex].ref.length > 0 ? (
                  <Event handle={meventRefs[mBirthIndex].ref} />
                ) : (
                  "Unknown Birthday"
                )}{" "}
                -
                {meventRefs.length > 0 &&
                mDeathIndex >= 0 &&
                meventRefs[mDeathIndex].ref.length > 0 ? (
                  <Event handle={meventRefs[mDeathIndex].ref} />
                ) : (
                  "the Present?"
                )}{" "}
                )
              </span>
            ) : (
              <span> Unknown</span>
            )}
          </li>
        </ul>
      </div>
      <div class="Sibilings flex-auto flex-col">
        <h4 class="my-0">
          {displayAsParent == false
            ? "Siblings (Half-Siblings, and Foster Siblings)"
            : "Children"}
        </h4>
        <ul class="bio">
          {siblings.length > 0
            ? siblings.map((sibling) => (
                <li>
                  <IndividualName inline={true} personId={sibling.id} /> (
                  {sibling.birth_ref_index >= 0 ? (
                    <Event
                      handle={
                        sibling.event_ref_list[sibling.birth_ref_index].ref
                      }
                    />
                  ) : (
                    "Unknown Birthday"
                  )}
                  -
                  {sibling.death_ref_index >= 0 ? (
                    <Event
                      handle={
                        sibling.event_ref_list[sibling.death_ref_index].ref
                      }
                    />
                  ) : (
                    "the Present?"
                  )}{" "}
                  )
                </li>
              ))
            : ""}
        </ul>
      </div>
    </>
  ) : (
    <span>family not found</span>
  )
}
