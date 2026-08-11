import { describe, expect, it } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";
import { generateSchedule, monthlyStraightLineAmount, netBookValue } from "./depreciation";

describe("monthlyStraightLineAmount", () => {
  it("divides depreciable base evenly across useful life", () => {
    const amount = monthlyStraightLineAmount(12000, 0, 60);
    expect(amount.toString()).toBe("200");
  });

  it("subtracts salvage value from the depreciable base", () => {
    const amount = monthlyStraightLineAmount(10000, 1000, 36);
    expect(amount.toString()).toBe("250");
  });

  it("returns zero when salvage value meets or exceeds cost", () => {
    const amount = monthlyStraightLineAmount(5000, 5000, 24);
    expect(amount.toString()).toBe("0");
  });

  it("throws for a non-positive useful life", () => {
    expect(() => monthlyStraightLineAmount(1000, 0, 0)).toThrow();
  });
});

describe("generateSchedule", () => {
  it("returns an empty schedule for non-depreciable assets (Land, CIP)", () => {
    const schedule = generateSchedule({
      originalCost: 500000,
      salvageValue: 0,
      usefulLifeMonths: 0,
      inServiceDate: new Date("2024-01-15"),
      isDepreciable: false,
    });
    expect(schedule).toEqual([]);
  });

  it("generates one entry per month for the full useful life", () => {
    const schedule = generateSchedule({
      originalCost: 12000,
      salvageValue: 0,
      usefulLifeMonths: 12,
      inServiceDate: new Date("2024-03-10"),
      isDepreciable: true,
    });
    expect(schedule).toHaveLength(12);
    expect(schedule[0].depreciationAmount.toString()).toBe("1000");
    expect(schedule[0].periodDate.toISOString()).toBe("2024-03-01T00:00:00.000Z");
    expect(schedule[11].periodDate.toISOString()).toBe("2025-02-01T00:00:00.000Z");
  });

  it("ends with accumulated depreciation exactly equal to the depreciable base", () => {
    const schedule = generateSchedule({
      originalCost: 10000,
      salvageValue: 1000,
      usefulLifeMonths: 36,
      inServiceDate: new Date("2024-01-01"),
      isDepreciable: true,
    });
    const last = schedule[schedule.length - 1];
    expect(last.accumulatedDepreciation.toString()).toBe("9000");
    expect(last.bookValue.toString()).toBe("1000");
  });

  it("absorbs rounding remainder in the final period", () => {
    // 1000 / 7 months = 142.857... rounds to 142.86/mo, which would overshoot by
    // period 7 if not corrected — the final period must land exactly on the base.
    const schedule = generateSchedule({
      originalCost: 1000,
      salvageValue: 0,
      usefulLifeMonths: 7,
      inServiceDate: new Date("2024-01-01"),
      isDepreciable: true,
    });
    const total = schedule.reduce(
      (sum, entry) => sum.plus(entry.depreciationAmount),
      new Decimal(0)
    );
    expect(total.toString()).toBe("1000");
    expect(schedule[schedule.length - 1].bookValue.toString()).toBe("0");
  });

  it("returns an empty schedule when salvage value equals cost", () => {
    const schedule = generateSchedule({
      originalCost: 5000,
      salvageValue: 5000,
      usefulLifeMonths: 24,
      inServiceDate: new Date("2024-01-01"),
      isDepreciable: true,
    });
    expect(schedule).toEqual([]);
  });

  describe("with an opening balance", () => {
    it("resumes forward from the opening balance instead of replaying history", () => {
      // 12000 / 60 months = 200/mo. Asset went into service in 2018, but we only
      // know its balance as of 2024-06-30 (imported from a legacy system) — the
      // schedule should not regenerate 2018-2024.
      const schedule = generateSchedule({
        originalCost: 12000,
        salvageValue: 0,
        usefulLifeMonths: 60,
        inServiceDate: new Date("2018-01-01"),
        isDepreciable: true,
        openingBalance: { asOfDate: new Date("2024-06-30"), accumulatedDepreciation: 10000 },
      });
      expect(schedule[0].periodDate.toISOString()).toBe("2024-07-01T00:00:00.000Z");
      expect(schedule[0].accumulatedDepreciation.toString()).toBe("10200");
      // remaining base is 2000, so it should take exactly 10 more months
      expect(schedule).toHaveLength(10);
      expect(schedule[schedule.length - 1].accumulatedDepreciation.toString()).toBe("12000");
      expect(schedule[schedule.length - 1].bookValue.toString()).toBe("0");
    });

    it("returns an empty schedule when already fully depreciated at the opening date", () => {
      const schedule = generateSchedule({
        originalCost: 12000,
        salvageValue: 0,
        usefulLifeMonths: 60,
        inServiceDate: new Date("2018-01-01"),
        isDepreciable: true,
        openingBalance: { asOfDate: new Date("2024-06-30"), accumulatedDepreciation: 12000 },
      });
      expect(schedule).toEqual([]);
    });

    it("still absorbs rounding remainder in the final period", () => {
      const schedule = generateSchedule({
        originalCost: 1000,
        salvageValue: 0,
        usefulLifeMonths: 7,
        inServiceDate: new Date("2024-01-01"),
        isDepreciable: true,
        openingBalance: { asOfDate: new Date("2024-01-01"), accumulatedDepreciation: 142.86 },
      });
      const total = schedule.reduce(
        (sum, entry) => sum.plus(entry.depreciationAmount),
        new Decimal(142.86)
      );
      expect(total.toString()).toBe("1000");
      expect(schedule[schedule.length - 1].bookValue.toString()).toBe("0");
    });
  });
});

describe("netBookValue", () => {
  it("subtracts accumulated depreciation from original cost", () => {
    expect(netBookValue(10000, 4000).toString()).toBe("6000");
  });
});
