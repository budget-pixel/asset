"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { assetSchema, INHERIT_ACTIVITY_VALUE } from "@/lib/schemas";
import { meetsCapitalizationThreshold } from "@/lib/capitalization";
import { formatCurrency } from "@/lib/format";
import { computeNextAdditionTag } from "@/lib/asset-tags";

export type FormState = { error?: string };

/** Looks up the next available addition tag (e.g. "9071-01") for a parent asset tag. */
export async function getNextAdditionTag(
  parentTag: string
): Promise<{ tag: string } | { error: string }> {
  await requireAdmin();

  const tag = parentTag.trim();
  if (!tag) return { error: "Enter a parent asset tag first." };

  const parent = await db.asset.findUnique({
    where: { assetTag: tag },
    include: { additions: { select: { assetTag: true } } },
  });
  if (!parent) return { error: `No asset found with tag "${tag}".` };
  if (parent.parentAssetId) {
    return { error: `${tag} is itself an addition — link to its base asset instead.` };
  }

  return { tag: computeNextAdditionTag(tag, parent.additions.map((a) => a.assetTag)) };
}

function resolveActivityIdInput(activityId: string | undefined): string | null {
  return activityId && activityId !== INHERIT_ACTIVITY_VALUE ? activityId : null;
}

/**
 * Resolves a typed parent asset tag to an id, enforcing that the hierarchy stays
 * exactly two levels deep (a base asset and its additions — an addition can't
 * itself have additions) and that an asset can't be linked to itself.
 */
async function resolveParentAssetId(
  parentAssetTag: string | undefined,
  selfId?: string
): Promise<{ parentAssetId: string | null } | { error: string }> {
  const tag = parentAssetTag?.trim();
  if (!tag) return { parentAssetId: null };

  const parent = await db.asset.findUnique({ where: { assetTag: tag } });
  if (!parent) {
    return { error: `No asset found with tag "${tag}".` };
  }
  if (parent.id === selfId) {
    return { error: "An asset cannot be linked to itself." };
  }
  if (parent.parentAssetId) {
    const grandparent = await db.asset.findUnique({ where: { id: parent.parentAssetId } });
    return {
      error: `${parent.assetTag} is itself an addition to ${grandparent?.assetTag ?? "another asset"} — link to that asset instead.`,
    };
  }
  if (selfId) {
    const existingAdditionCount = await db.asset.count({ where: { parentAssetId: selfId } });
    if (existingAdditionCount > 0) {
      return { error: "This asset already has its own additions linked to it and can't also be an addition to another asset." };
    }
  }
  return { parentAssetId: parent.id };
}

export async function createAsset(
  _prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const parsed = assetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const category = await db.assetCategory.findUnique({ where: { id: parsed.data.categoryId } });
  const threshold = category?.capitalizationThreshold ? Number(category.capitalizationThreshold) : null;
  if (!meetsCapitalizationThreshold(parsed.data.originalCost, threshold)) {
    return {
      error: `Per county policy, ${category!.name} must cost at least ${formatCurrency(threshold!)} to be capitalized.`,
    };
  }

  const parentResult = await resolveParentAssetId(parsed.data.parentAssetTag);
  if ("error" in parentResult) {
    return { error: parentResult.error };
  }

  const { parentAssetTag: _parentAssetTag, ...assetData } = parsed.data;

  try {
    await db.asset.create({
      data: {
        ...assetData,
        activityId: resolveActivityIdInput(parsed.data.activityId),
        parentAssetId: parentResult.parentAssetId,
      },
    });
  } catch {
    return { error: "An asset with that tag already exists." };
  }

  revalidatePath("/assets");
  revalidatePath("/reports/register");
  redirect("/assets");
}

export async function updateAsset(
  id: string,
  _prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  // Capitalization threshold is only enforced on create, not here — thousands
  // of legitimately-imported historical assets sit below today's threshold,
  // and blocking edits to them (even unrelated ones, like fixing a typo)
  // would make the register impossible to maintain.
  await requireAdmin();

  const parsed = assetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const parentResult = await resolveParentAssetId(parsed.data.parentAssetTag, id);
  if ("error" in parentResult) {
    return { error: parentResult.error };
  }

  const { parentAssetTag: _parentAssetTag, ...assetData } = parsed.data;

  try {
    await db.asset.update({
      where: { id },
      data: {
        ...assetData,
        activityId: resolveActivityIdInput(parsed.data.activityId),
        parentAssetId: parentResult.parentAssetId,
      },
    });
  } catch {
    return { error: "An asset with that tag already exists." };
  }

  revalidatePath("/assets");
  revalidatePath(`/assets/${id}`);
  revalidatePath("/reports/register");
  redirect(`/assets/${id}`);
}

export async function deleteAsset(id: string) {
  await requireAdmin();

  await db.asset.delete({ where: { id } });

  revalidatePath("/assets");
  revalidatePath("/reports/register");
  redirect("/assets");
}
