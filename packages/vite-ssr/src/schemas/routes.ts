import { z } from "zod";

export const ExternalPage = z.object({
  title: z.string(),
  route: z.string(),
  html: z.string(),
  children: z.any(),
});
export type ExternalPage = z.infer<typeof ExternalPage>;

const NavItemBase = ExternalPage.partial();

export type NavigatonItem = z.infer<typeof NavItemBase> & {
  children: NavigatonItem[];
};

export const NavigatonItem: z.ZodType<NavigatonItem> = NavItemBase.extend({
  children: z.lazy(() => NavigatonItem.array()),
});
