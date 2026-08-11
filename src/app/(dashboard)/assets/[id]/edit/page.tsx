import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { updateAsset } from "@/actions/assets";
import { AssetForm } from "@/components/asset-form";

export default async function EditAssetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect(`/assets/${id}`);

  const [asset, categoriesRaw, departments, locations, activities] = await Promise.all([
    db.asset.findUnique({ where: { id }, include: { parentAsset: { select: { assetTag: true } } } }),
    db.assetCategory.findMany({ orderBy: { name: "asc" } }),
    db.department.findMany({ orderBy: { name: "asc" } }),
    db.location.findMany({ orderBy: { name: "asc" } }),
    db.activity.findMany({ orderBy: [{ function: "asc" }, { activity: "asc" }] }),
  ]);

  if (!asset) notFound();

  const categories = categoriesRaw.map((c) => ({
    id: c.id,
    name: c.name,
    capitalizationThreshold: c.capitalizationThreshold?.toString() ?? null,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit Asset</h1>
      <AssetForm
        action={updateAsset.bind(null, id)}
        categories={categories}
        departments={departments}
        locations={locations}
        activities={activities}
        asset={{
          assetTag: asset.assetTag,
          name: asset.name,
          description: asset.description,
          categoryId: asset.categoryId,
          departmentId: asset.departmentId,
          locationId: asset.locationId,
          purchaseDate: asset.purchaseDate,
          inServiceDate: asset.inServiceDate,
          originalCost: asset.originalCost.toString(),
          salvageValue: asset.salvageValue.toString(),
          usefulLifeMonths: asset.usefulLifeMonths,
          activityId: asset.activityId,
          parentAssetTag: asset.parentAsset?.assetTag ?? null,
        }}
      />
    </div>
  );
}
