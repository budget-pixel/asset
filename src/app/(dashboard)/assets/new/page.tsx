import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createAsset } from "@/actions/assets";
import { AssetForm } from "@/components/asset-form";

export default async function NewAssetPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/assets");

  const [categoriesRaw, departments, locations, activities] = await Promise.all([
    db.assetCategory.findMany({ orderBy: { name: "asc" } }),
    db.department.findMany({ orderBy: { name: "asc" } }),
    db.location.findMany({ orderBy: { name: "asc" } }),
    db.activity.findMany({ orderBy: [{ function: "asc" }, { activity: "asc" }] }),
  ]);
  const categories = categoriesRaw.map((c) => ({
    id: c.id,
    name: c.name,
    capitalizationThreshold: c.capitalizationThreshold?.toString() ?? null,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Add Asset</h1>
      <AssetForm
        action={createAsset}
        categories={categories}
        departments={departments}
        locations={locations}
        activities={activities}
      />
    </div>
  );
}
