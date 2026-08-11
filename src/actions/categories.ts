"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { assetCategorySchema } from "@/lib/schemas";

export type FormState = { error?: string };

export async function createCategory(
  _prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const parsed = assetCategorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await db.assetCategory.create({ data: parsed.data });
  } catch {
    return { error: "A category with that name already exists." };
  }

  revalidatePath("/categories");
  return {};
}

export async function deleteCategory(id: string) {
  await requireAdmin();

  const assetCount = await db.asset.count({ where: { categoryId: id } });
  if (assetCount > 0) {
    throw new Error("Cannot delete a category that still has assets assigned to it.");
  }

  await db.assetCategory.delete({ where: { id } });
  revalidatePath("/categories");
}
