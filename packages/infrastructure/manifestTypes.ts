import * as z from "zod";


export const ValueClass = z.object({
    "id": z.string(),
    "pageHref": z.string(),
    "outputHref": z.string(),
    "route": z.string(),
});
export type ValueClass = z.infer<typeof ValueClass>;

export const Apis = z.object({
    "dataType": z.string(),
    "value": z.array(z.array(z.union([ValueClass, z.string()]))),
});
export type Apis = z.infer<typeof Apis>;

export const Manifest = z.object({
    "apis": Apis,
});
export type Manifest = z.infer<typeof Manifest>;
