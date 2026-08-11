/**
 * One-time import of the county's Munis capital asset register, from the full
 * "Capital_Asset_Inquiry" export (93 columns — includes cost, useful life, salvage
 * value, and life-to-date accumulated depreciation per asset, unlike the earlier
 * partial "Depr By Activity" extract this replaces).
 *
 * Usage:
 *   npx tsx scripts/import-legacy-assets.ts <Capital_Asset_Inquiry-full-export.xlsx> [--reset]
 *
 * --reset deletes all previously-imported assets (everything except the original
 * demo seed assets) before importing, so re-running doesn't layer a second partial
 * import on top of a prior one.
 *
 * Idempotent otherwise: safe to re-run without --reset (upserts by assetTag, and by
 * [assetId, periodDate] for the opening depreciation entry).
 *
 * KNOWN GAP: Munis doesn't give a physical-site name distinct from the org/department
 * code in this export (STORG LOC / FLOOR / ROOM are blank for essentially every
 * active asset), so all imported assets share a single placeholder Location
 * ("Unspecified (Legacy Import)"). Department is populated for real from LOCATION
 * DESC, which does have genuine names.
 */
import * as XLSX from "xlsx";
import { db } from "../src/lib/db";
import { periodStart } from "../src/lib/depreciation";
import { toTitleCase } from "../src/lib/text";
import { CATEGORY_DEFAULTS } from "../src/lib/category-defaults";

// FY25 close date — confirmed via the "CURRENT FISCAL YEAR" column (all active rows
// report 2025) and standard Florida county fiscal year (Oct 1 - Sep 30).
const OPENING_AS_OF_DATE = new Date(Date.UTC(2025, 8, 30));

const UNSPECIFIED_LOCATION_NAME = "Unspecified (Legacy Import)";

const SEED_ASSET_TAGS = ["BLD-0001", "LND-0001", "VEH-0001", "EQP-0001", "FUR-0001", "CIP-0001"];

type Row = {
  asset: string;
  description: string;
  status: string;
  serialParcel: string;
  classCd: string;
  subclass: string;
  locationCode: string;
  locationDesc: string;
  dateAcq: Date | null;
  acqCost: number;
  estUsefulLifeYears: number;
  currBookVal: number;
  estSalvageVal: number;
  depreciateFlag: string;
  ltdAccumDepr: number;
};

function readExport(filePath: string): Row[] {
  const wb = XLSX.readFile(filePath, { cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });
  const [, ...dataRows] = rows;
  return dataRows
    .filter((r) => r[0] != null && r[0] !== "")
    .map((r) => ({
      asset: String(r[0]).trim(),
      description: String(r[1] ?? "").trim(),
      status: String(r[3] ?? "").trim(),
      serialParcel: String(r[7] ?? "").trim(),
      classCd: String(r[8] ?? "").trim(),
      subclass: String(r[9] ?? "").trim(),
      locationCode: String(r[12] ?? "").trim(),
      locationDesc: String(r[13] ?? "").trim(),
      dateAcq: r[20] instanceof Date ? r[20] : null,
      acqCost: Number(r[21] ?? 0),
      estUsefulLifeYears: Number(r[36] ?? 0),
      currBookVal: Number(r[39] ?? 0),
      estSalvageVal: Number(r[40] ?? 0),
      depreciateFlag: String(r[50] ?? "").trim(),
      ltdAccumDepr: Number(r[57] ?? 0),
    }));
}

function mapCategory(classCd: string, subclass: string): string {
  switch (classCd) {
    case "B":
      return "Buildings";
    case "L":
      return "Land";
    case "CP":
      return "Construction in Progress";
    case "IN":
      return "Infrastructure";
    case "I":
      return "Improvements Other Than Buildings";
    case "ME":
      if (subclass === "V") return "Vehicles";
      if (subclass === "FF") return "Furniture & Fixtures";
      return "Machinery & Equipment";
    default:
      return "Machinery & Equipment";
  }
}

async function main() {
  const args = process.argv.slice(2);
  const reset = args.includes("--reset");
  const filePath = args.find((a) => !a.startsWith("--"));

  if (!filePath) {
    console.error(
      "Usage: npx tsx scripts/import-legacy-assets.ts <Capital_Asset_Inquiry-full-export.xlsx> [--reset]"
    );
    process.exit(1);
  }

  if (reset) {
    const deleted = await db.asset.deleteMany({
      where: { assetTag: { notIn: SEED_ASSET_TAGS } },
    });
    console.log(
      `--reset: deleted ${deleted.count} previously-imported assets (depreciation entries cascade).`
    );
  }

  const rows = readExport(filePath);
  console.log(`Read ${rows.length} rows.`);

  const activeRows = rows.filter((r) => r.status === "A" && r.classCd);
  console.log(
    `${activeRows.length} active rows with a class code (skipping ${rows.length - activeRows.length} disposed/retired/blank).`
  );

  const categories = new Map<
    string,
    { id: string; isDepreciable: boolean; defaultUsefulLifeMonths: number }
  >();
  for (const [name, defaults] of Object.entries(CATEGORY_DEFAULTS)) {
    const cat = await db.assetCategory.upsert({
      where: { name },
      update: defaults,
      create: { name, ...defaults },
    });
    categories.set(name, cat);
  }

  const location = await db.location.upsert({
    where: { name: UNSPECIFIED_LOCATION_NAME },
    update: {},
    create: { name: UNSPECIFIED_LOCATION_NAME },
  });

  const departmentByCode = new Map<string, { id: string }>();

  let imported = 0;
  let skippedNoDate = 0;
  let skippedNoCost = 0;
  let openingBalancesSet = 0;
  let usefulLifeFallbacks = 0;
  const totalsByCategory = new Map<
    string,
    { count: number; cost: number; accumulated: number; bookValue: number }
  >();

  for (const row of activeRows) {
    if (!row.dateAcq) {
      skippedNoDate++;
      continue;
    }
    if (!row.acqCost || row.acqCost <= 0) {
      skippedNoCost++;
      continue;
    }

    const categoryName = mapCategory(row.classCd, row.subclass);
    const category = categories.get(categoryName)!;
    const isDepreciable = category.isDepreciable && row.depreciateFlag === "Y";

    let department = departmentByCode.get(row.locationCode);
    if (!department) {
      department = await db.department.upsert({
        where: { code: row.locationCode || "UNSPEC" },
        update: {},
        create: {
          code: row.locationCode || "UNSPEC",
          name: toTitleCase(row.locationDesc || "Unspecified"),
        },
      });
      departmentByCode.set(row.locationCode, department);
    }

    let usefulLifeMonths: number;
    if (!isDepreciable) {
      usefulLifeMonths = 1;
    } else if (row.estUsefulLifeYears > 0) {
      usefulLifeMonths = row.estUsefulLifeYears * 12;
    } else {
      usefulLifeMonths = category.defaultUsefulLifeMonths;
      usefulLifeFallbacks++;
    }

    // Non-depreciated assets (below capitalization threshold, historic, etc.) get
    // salvage = cost so the depreciable base is zero, rather than trusting the
    // file's own salvage figure — confirmed these always carry $0 accumulated
    // depreciation, so there's nothing to preserve.
    const salvageValue = isDepreciable ? row.estSalvageVal : row.acqCost;
    const openingAccum = isDepreciable ? Math.max(0, row.ltdAccumDepr) : 0;

    const description = row.serialParcel ? `Serial/Parcel: ${row.serialParcel}` : null;

    const asset = await db.asset.upsert({
      where: { assetTag: row.asset },
      update: {},
      create: {
        assetTag: row.asset,
        name: toTitleCase(row.description || row.asset),
        description,
        categoryId: category.id,
        departmentId: department.id,
        locationId: location.id,
        purchaseDate: row.dateAcq,
        inServiceDate: row.dateAcq,
        originalCost: row.acqCost,
        salvageValue,
        usefulLifeMonths: Math.max(usefulLifeMonths, 1),
        openingAccumulatedDepreciation: openingAccum > 0 ? openingAccum : null,
        openingAsOfDate: openingAccum > 0 ? OPENING_AS_OF_DATE : null,
      },
    });

    if (openingAccum > 0) {
      await db.depreciationEntry.upsert({
        where: {
          assetId_periodDate: { assetId: asset.id, periodDate: periodStart(OPENING_AS_OF_DATE) },
        },
        update: {},
        create: {
          assetId: asset.id,
          periodDate: periodStart(OPENING_AS_OF_DATE),
          depreciationAmount: openingAccum,
          accumulatedDepreciation: openingAccum,
          bookValue: row.acqCost - openingAccum,
          isOpeningBalance: true,
        },
      });
      openingBalancesSet++;
    }

    imported++;
    const totals = totalsByCategory.get(categoryName) ?? {
      count: 0,
      cost: 0,
      accumulated: 0,
      bookValue: 0,
    };
    totals.count++;
    totals.cost += row.acqCost;
    totals.accumulated += openingAccum;
    totals.bookValue += row.acqCost - openingAccum;
    totalsByCategory.set(categoryName, totals);
  }

  console.log(`\nImported ${imported} assets (${openingBalancesSet} with opening balances).`);
  console.log(
    `Skipped: ${skippedNoDate} missing acquisition date, ${skippedNoCost} zero/missing cost.`
  );
  console.log(`Useful life fell back to category default for ${usefulLifeFallbacks} assets.\n`);

  console.log("Totals by category:");
  let grandCost = 0;
  let grandAccum = 0;
  let grandBook = 0;
  for (const [name, t] of totalsByCategory) {
    console.log(
      `  ${name.padEnd(35)} count=${t.count}  cost=$${t.cost.toFixed(2)}  accum=$${t.accumulated.toFixed(2)}  book=$${t.bookValue.toFixed(2)}`
    );
    grandCost += t.cost;
    grandAccum += t.accumulated;
    grandBook += t.bookValue;
  }
  console.log(
    `  ${"TOTAL".padEnd(35)} cost=$${grandCost.toFixed(2)}  accum=$${grandAccum.toFixed(2)}  book=$${grandBook.toFixed(2)}`
  );
  console.log('\nCross-check these totals against "BCC FA Note Disclosure FY25.xlsx".');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
