import { z } from "astro:schema";

export const genders = z.union([z.literal("Male"), z.literal("Female")]);
export type genders = z.infer<typeof genders>;

const genderConstant = z.object({
  JSONconstant: z.union([z.literal(0), z.literal(1)]),
  textName: genders,
  iconName: z.union([z.literal("ion:male"), z.literal("ion:female")]),
  iconColor: z.union([z.literal("color-male"), z.literal("color-female")]),
});
type genderConstant = z.infer<typeof genderConstant>;

export const male: genderConstant = {
  JSONconstant: 1,
  textName: "Male",
  iconName: "ion:male",
  iconColor: "color-male",
};

export const female: genderConstant = {
  JSONconstant: 0,
  textName: "Female",
  iconName: "ion:female",
  iconColor: "color-female",
};
