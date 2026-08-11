"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { locationSchema } from "@/lib/schemas";

export type FormState = { error?: string };

export async function createLocation(
  _prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const parsed = locationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await db.location.create({ data: parsed.data });
  } catch {
    return { error: "A location with that name already exists." };
  }

  revalidatePath("/locations");
  return {};
}

export async function deleteLocation(id: string) {
  await requireAdmin();

  const assetCount = await db.asset.count({ where: { locationId: id } });
  if (assetCount > 0) {
    throw new Error("Cannot delete a location that still has assets assigned to it.");
  }

  await db.location.delete({ where: { id } });
  revalidatePath("/locations");
}
