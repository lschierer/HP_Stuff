import {
  type APIRoute,
  type InferGetStaticParamsType,
  type InferGetStaticPropsType,
  type GetStaticPaths,
} from "astro";
import { getCollection, getEntry, type CollectionEntry } from "astro:content";

export const prerender = true;
const DEBUG = false;

export const GET: APIRoute = async ({ params, request }) => {
  if (DEBUG) {
    console.log(`request is ${request.url.toString()}`);
  }
  let id: string = params.id ? params.id : "";
  if (id !== "") {
    if (id.includes("/")) {
      const temp = id.split("/").pop();
      if (temp !== undefined) {
        id = temp;
      }
    }
    console.log(`id is ${id}`);
    const entry = await getEntry("gramps", id);
    if (entry !== null && entry !== undefined) {
      return new Response(JSON.stringify(entry.data));
    }
  }
  return new Response(JSON.stringify(""));
};

export const getStaticPaths = (async () => {
  const grampsEntries: CollectionEntry<"gramps">[] =
    await getCollection("gramps");
  return grampsEntries.map((entry) => ({
    params: { id: entry.id },
    props: { entry },
  }));
}) satisfies GetStaticPaths;

export type Params = InferGetStaticParamsType<typeof getStaticPaths>;
export type Props = InferGetStaticPropsType<typeof getStaticPaths>;
