"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { userSchema } from "@/lib/schemas";

export type FormState = { error?: string };

export async function createUser(
  _prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const parsed = userSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { username, name, password, role } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await db.user.create({ data: { username, name, passwordHash, role } });
  } catch {
    return { error: "A user with that username already exists." };
  }

  revalidatePath("/users");
  return {};
}

export async function updateUserRole(userId: string, role: "ADMIN" | "VIEWER") {
  const session = await requireAdmin();

  if (session.user.id === userId && role !== "ADMIN") {
    const adminCount = await db.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      throw new Error("Cannot remove the last admin's own admin role.");
    }
  }

  await db.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/users");
}

export async function deleteUser(id: string) {
  const session = await requireAdmin();

  if (session.user.id === id) {
    throw new Error("You cannot delete your own account.");
  }

  await db.user.delete({ where: { id } });
  revalidatePath("/users");
}
