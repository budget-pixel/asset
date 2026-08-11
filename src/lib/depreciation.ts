import { Decimal } from "@prisma/client/runtime/library";

export type OpeningBalance = {
  asOfDate: Date;
  accumulatedDepreciation: Decimal | number | string;
};

export type DepreciableAssetInput = {
  originalCost: Decimal | number | string;
  salvageValue: Decimal | number | string;
  usefulLifeMonths: number;
  inServiceDate: Date;
  isDepreciable: boolean;
  /**
   * For migrated assets that already carry accumulated depreciation as of a known
   * date (e.g. imported from a legacy system). When present, the schedule resumes
   * forward from this balance instead of replaying history from inServiceDate —
   * replaying would recompute prior periods with our formula and diverge from
   * whatever the legacy system actually posted.
   */
  openingBalance?: OpeningBalance;
};

export type ScheduleEntry = {
  periodDate: Date;
  depreciationAmount: Decimal;
  accumulatedDepreciation: Decimal;
  bookValue: Decimal;
};

/** First-of-month UTC date for a given period. */
export function periodStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addMonths(date: Date, months: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

/**
 * Straight-line monthly depreciation amount.
 * (cost - salvage) / useful life in months, rounded to cents.
 */
export function monthlyStraightLineAmount(
  originalCost: Decimal | number | string,
  salvageValue: Decimal | number | string,
  usefulLifeMonths: number
): Decimal {
  if (usefulLifeMonths <= 0) {
    throw new Error("usefulLifeMonths must be greater than zero");
  }
  const cost = new Decimal(originalCost);
  const salvage = new Decimal(salvageValue);
  const depreciableBase = cost.minus(salvage);
  if (depreciableBase.lessThanOrEqualTo(0)) {
    return new Decimal(0);
  }
  return depreciableBase.dividedBy(usefulLifeMonths).toDecimalPlaces(2);
}

/**
 * Generates the full month-by-month straight-line depreciation schedule for an asset,
 * from its in-service date until the depreciable base is fully recovered.
 * Non-depreciable assets (Land, Construction in Progress) return an empty schedule.
 * The final period absorbs any rounding remainder so accumulated depreciation lands
 * exactly on (cost - salvage).
 */
export function generateSchedule(asset: DepreciableAssetInput): ScheduleEntry[] {
  if (!asset.isDepreciable) return [];

  const cost = new Decimal(asset.originalCost);
  const salvage = new Decimal(asset.salvageValue);
  const depreciableBase = cost.minus(salvage);
  if (depreciableBase.lessThanOrEqualTo(0)) return [];

  const monthlyAmount = monthlyStraightLineAmount(cost, salvage, asset.usefulLifeMonths);
  if (monthlyAmount.lessThanOrEqualTo(0)) return [];

  const entries: ScheduleEntry[] = [];
  let accumulated = asset.openingBalance
    ? new Decimal(asset.openingBalance.accumulatedDepreciation)
    : new Decimal(0);
  let period = asset.openingBalance
    ? addMonths(periodStart(asset.openingBalance.asOfDate), 1)
    : periodStart(asset.inServiceDate);

  if (accumulated.greaterThanOrEqualTo(depreciableBase)) return [];

  // Safety cap: elapsed months before an opening balance already happened outside
  // this loop, so bound iterations by useful life rather than trusting remaining
  // amount alone to terminate in pathological rounding cases.
  const maxIterations = asset.usefulLifeMonths + 1;

  for (let i = 0; i < maxIterations; i++) {
    const remaining = depreciableBase.minus(accumulated);
    if (remaining.lessThanOrEqualTo(0)) break;

    const amount = Decimal.min(monthlyAmount, remaining);
    accumulated = accumulated.plus(amount);
    entries.push({
      periodDate: period,
      depreciationAmount: amount,
      accumulatedDepreciation: accumulated,
      bookValue: cost.minus(accumulated),
    });

    if (accumulated.greaterThanOrEqualTo(depreciableBase)) break;
    period = addMonths(period, 1);
  }

  return entries;
}

/** Net book value = original cost - accumulated depreciation. */
export function netBookValue(
  originalCost: Decimal | number | string,
  accumulatedDepreciation: Decimal | number | string
): Decimal {
  return new Decimal(originalCost).minus(new Decimal(accumulatedDepreciation));
}
