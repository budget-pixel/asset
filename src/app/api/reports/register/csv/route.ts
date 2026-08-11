import { auth } from "@/lib/auth";
import { getAssetsWithBookValue } from "@/lib/reporting";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const assets = await getAssetsWithBookValue();

  const header = [
    "Asset Tag",
    "Name",
    "Category",
    "Department",
    "Location",
    "Purchase Date",
    "In-Service Date",
    "Original Cost",
    "Accumulated Depreciation",
    "Net Book Value",
  ];

  const rows = assets.map((a) =>
    [
      a.assetTag,
      a.name,
      a.category.name,
      a.department.name,
      a.location.name,
      a.purchaseDate.toISOString().slice(0, 10),
      a.inServiceDate.toISOString().slice(0, 10),
      a.originalCost.toString(),
      a.accumulatedDepreciation.toString(),
      a.bookValue.toString(),
    ]
      .map((v) => csvEscape(String(v)))
      .join(",")
  );

  const csv = [header.join(","), ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="fixed-asset-register-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
