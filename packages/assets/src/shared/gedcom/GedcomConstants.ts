import { z } from "zod";

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

export const HogwartsHouses = z.enum([
  "Gryffindor",
  "Hufflepuff",
  "Ravenclaw",
  "Slytherin",
  "Unknown",
]);
export type HogwartsHouses = z.infer<typeof HogwartsHouses>;

export const BloodStatus = z.enum([
  "pure-blood",
  "half-blood",
  "1st gen magical",
  "Unknown",
]);
export type BloodStatus = z.infer<typeof BloodStatus>;

export const SocialClass = z.enum([
  "Lower Class",
  "Middle Class",
  "Upper Class",
  "Unknown",
]);
export type SocialClass = z.infer<typeof SocialClass>;

export const BloodWarPosition = z.enum([
  "Dumbledore's Army",
  "Order of the Phoenix",
  "Death Eater",
  "Junior Death Eater",
  "Victim",
  "Unknown",
]);
export type BloodWarPosition = z.infer<typeof BloodWarPosition>;
