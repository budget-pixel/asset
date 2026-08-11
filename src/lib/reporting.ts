import { Decimal } from "@prisma/client/runtime/library";
import type { Activity } from "@prisma/client";
import { db } from "@/lib/db";
import { ACTIVITY_TAXONOMY, SCHEDULE_COLUMNS, scheduleColumn } from "@/lib/activity-taxonomy";

/**
 * An asset's GASB function/activity is its own override when set, otherwise its
 * department's default. Neither is required, so the result can be null — reports
 * surface that as "Unassigned" rather than guessing.
 */
export function resolveActivity(asset: {
  activity: Activity | null;
  department: { defaultActivity: Activity | null };
}): Activity | null {
  return asset.activity ?? asset.department.defaultActivity ?? null;
}

export type AssetSortColumn = "assetTag" | "name" | "category" | "department";

export type AssetListParams = {
  search?: string;
  sortBy?: AssetSortColumn;
  sortDir?: "asc" | "desc";
};

/**
 * All assets with their current accumulated depreciation and net book value,
 * derived from the most recent posted DepreciationEntry. Assets with no posted
 * entries yet (e.g. never-depreciated Land/CIP, or newly created assets before
 * the next depreciation run) show full original cost as book value.
 *
 * Search and sort run in the database rather than in JS — with 3,000+ assets,
 * shipping the full table to filter/sort client-side isn't worth it.
 */
export async function getAssetsWithBookValue(params: AssetListParams = {}) {
  const { search, sortBy = "assetTag", sortDir = "asc" } = params;

  const where = search
    ? {
        OR: [
          { assetTag: { contains: search, mode: "insensitive" as const } },
          { name: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const orderBy =
    sortBy === "category"
      ? { category: { name: sortDir } }
      : sortBy === "department"
        ? { department: { name: sortDir } }
        : sortBy === "name"
          ? { name: sortDir }
          : { assetTag: sortDir };

  const assets = await db.asset.findMany({
    where,
    include: {
      category: true,
      department: true,
      location: true,
      depreciationEntries: {
        orderBy: { periodDate: "desc" },
        take: 1,
      },
    },
    orderBy,
  });

  return assets.map((asset) => {
    const latest = asset.depreciationEntries[0];
    const accumulatedDepreciation = latest
      ? new Decimal(latest.accumulatedDepreciation)
      : new Decimal(0);
    const bookValue = latest ? new Decimal(latest.bookValue) : new Decimal(asset.originalCost);
    return { ...asset, accumulatedDepreciation, bookValue };
  });
}

export type AssetWithBookValue = Awaited<ReturnType<typeof getAssetsWithBookValue>>[number];

export type ActivityMatrixRow = {
  function: string;
  activity: string;
  columns: Record<(typeof SCHEDULE_COLUMNS)[number], Decimal>;
  total: Decimal;
};

function emptyColumns(): ActivityMatrixRow["columns"] {
  return Object.fromEntries(SCHEDULE_COLUMNS.map((c) => [c, new Decimal(0)])) as ActivityMatrixRow["columns"];
}

/**
 * Original cost grouped by GASB function/activity and disclosure category — the same
 * shape as the comptroller's "Capital Assets by Function and Activity" schedule.
 * Rows for every taxonomy entry are always present (even at $0) so the report reads
 * identically to her schedule; assets with no resolvable activity land in a separate
 * "unassigned" row so the gap stays visible instead of being silently dropped.
 */
export async function getFunctionActivityMatrix(): Promise<{
  rows: ActivityMatrixRow[];
  unassigned: ActivityMatrixRow;
  grandTotal: ActivityMatrixRow;
}> {
  const assets = await db.asset.findMany({
    include: {
      category: true,
      department: { include: { defaultActivity: true } },
      activity: true,
    },
  });

  const keyFor = (fn: string, act: string) => `${fn}|||${act}`;
  const byKey = new Map<string, ActivityMatrixRow>();
  for (const { function: fn, activity: act } of ACTIVITY_TAXONOMY) {
    byKey.set(keyFor(fn, act), { function: fn, activity: act, columns: emptyColumns(), total: new Decimal(0) });
  }

  const unassigned: ActivityMatrixRow = {
    function: "Unassigned",
    activity: "Unassigned",
    columns: emptyColumns(),
    total: new Decimal(0),
  };
  const grandTotal: ActivityMatrixRow = {
    function: "Total",
    activity: "",
    columns: emptyColumns(),
    total: new Decimal(0),
  };

  for (const asset of assets) {
    const resolved = resolveActivity(asset);
    const row = resolved ? (byKey.get(keyFor(resolved.function, resolved.activity)) ?? unassigned) : unassigned;
    const column = scheduleColumn(asset.category.name);
    const cost = new Decimal(asset.originalCost);

    row.columns[column] = row.columns[column].plus(cost);
    row.total = row.total.plus(cost);
    grandTotal.columns[column] = grandTotal.columns[column].plus(cost);
    grandTotal.total = grandTotal.total.plus(cost);
  }

  return { rows: [...byKey.values()], unassigned, grandTotal };
}
