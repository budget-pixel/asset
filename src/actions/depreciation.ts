"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { generateSchedule, periodStart } from "@/lib/depreciation";

/**
 * Posts depreciation entries for every period from each asset's in-service date
 * through the current month that hasn't already been posted. Safe to re-run —
 * already-posted periods are skipped via the (assetId, periodDate) unique constraint.
 */
export async function runMonthlyDepreciation(): Promise<{ posted: number }> {
  await requireAdmin();

  const assets = await db.asset.findMany({
    include: { category: true, depreciationEntries: { select: { periodDate: true } } },
  });

  const currentPeriod = periodStart(new Date());
  let posted = 0;

  for (const asset of assets) {
    const schedule = generateSchedule({
      originalCost: asset.originalCost,
      salvageValue: asset.salvageValue,
      usefulLifeMonths: asset.usefulLifeMonths,
      inServiceDate: asset.inServiceDate,
      isDepreciable: asset.category.isDepreciable,
      openingBalance:
        asset.openingAccumulatedDepreciation != null && asset.openingAsOfDate != null
          ? {
              asOfDate: asset.openingAsOfDate,
              accumulatedDepreciation: asset.openingAccumulatedDepreciation,
            }
          : undefined,
    });

    const alreadyPosted = new Set(
      asset.depreciationEntries.map((e) => e.periodDate.getTime())
    );

    const due = schedule.filter(
      (entry) =>
        entry.periodDate.getTime() <= currentPeriod.getTime() &&
        !alreadyPosted.has(entry.periodDate.getTime())
    );

    if (due.length === 0) continue;

    await db.depreciationEntry.createMany({
      data: due.map((entry) => ({
        assetId: asset.id,
        periodDate: entry.periodDate,
        depreciationAmount: entry.depreciationAmount,
        accumulatedDepreciation: entry.accumulatedDepreciation,
        bookValue: entry.bookValue,
      })),
      skipDuplicates: true,
    });
    posted += due.length;
  }

  revalidatePath("/reports/register");
  revalidatePath("/reports/depreciation-expense");
  revalidatePath("/assets");

  return { posted };
}
