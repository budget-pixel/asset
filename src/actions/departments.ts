"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { departmentSchema } from "@/lib/schemas";

export type FormState = { error?: string };

export async function createDepartment(
  _prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const parsed = departmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await db.department.create({ data: parsed.data });
  } catch {
    return { error: "A department with that name or code already exists." };
  }

  revalidatePath("/departments");
  return {};
}

export async function renameDepartment(departmentId: string, name: string) {
  await requireAdmin();

  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Name is required.");
  }

  try {
    await db.department.update({ where: { id: departmentId }, data: { name: trimmed } });
  } catch {
    throw new Error("A department with that name already exists.");
  }

  revalidatePath("/departments");
  revalidatePath("/assets");
  revalidatePath("/reports/register");
  revalidatePath("/reports/depreciation-expense");
}

export async function setDepartmentActivity(departmentId: string, activityId: string | null) {
  await requireAdmin();

  await db.department.update({
    where: { id: departmentId },
    data: { defaultActivityId: activityId },
  });

  revalidatePath("/departments");
  revalidatePath("/reports/by-activity");
}

export async function deleteDepartment(id: string) {
  await requireAdmin();

  const assetCount = await db.asset.count({ where: { departmentId: id } });
  if (assetCount > 0) {
    throw new Error("Cannot delete a department that still has assets assigned to it.");
  }

  await db.department.delete({ where: { id } });
  revalidatePath("/departments");
}
