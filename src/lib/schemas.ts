import { z } from "zod";

export const assetCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  defaultUsefulLifeMonths: z.coerce.number().int().min(0),
  isDepreciable: z.coerce.boolean(),
});

export const departmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required").max(10),
});

export const locationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
});

export const assetSchema = z.object({
  assetTag: z.string().min(1, "Asset tag is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  departmentId: z.string().min(1, "Department is required"),
  locationId: z.string().min(1, "Location is required"),
  purchaseDate: z.coerce.date(),
  inServiceDate: z.coerce.date(),
  originalCost: z.coerce.number().nonnegative(),
  salvageValue: z.coerce.number().nonnegative().default(0),
  usefulLifeMonths: z.coerce.number().int().min(0),
  activityId: z.string().optional(),
  parentAssetTag: z.string().optional(),
});

/** Sentinel used in the Activity <Select> for "inherit from department". */
export const INHERIT_ACTIVITY_VALUE = "__inherit__";

export const userSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Username can only contain letters, numbers, . _ -"),
  name: z.string().min(1, "Name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "VIEWER"]),
});
