/**
 * Asset category defaults per the Walton County Board of County Commissioners
 * Capital Asset Policy (BCC approved 8/11/21), Part X — Summary of Asset
 * Classification and Threshold. Used to seed/upsert AssetCategory rows in both
 * prisma/seed.ts and scripts/import-legacy-assets.ts so the two can't drift.
 *
 * capitalizationThreshold is the minimum original cost to capitalize an asset
 * in that category; null means "Capitalize All" (no threshold).
 *
 * The policy doesn't distinguish Furniture & Fixtures from Machinery, Vehicles,
 * and Equipment — all three share the same $5,000 threshold and 3-5 year life
 * (we use 5 years as the single default). Leasehold Improvements isn't a
 * category the policy names explicitly (this county doesn't lease); it's kept
 * for completeness with the same threshold/life as Improvements Other Than
 * Buildings, the closest analogous policy category.
 */
export const CATEGORY_DEFAULTS: Record<
  string,
  {
    defaultUsefulLifeMonths: number;
    isDepreciable: boolean;
    capitalizationThreshold: number | null;
  }
> = {
  Land: { defaultUsefulLifeMonths: 0, isDepreciable: false, capitalizationThreshold: null },
  Buildings: {
    defaultUsefulLifeMonths: 480, // 40 years
    isDepreciable: true,
    capitalizationThreshold: null, // "Capitalize All"
  },
  "Improvements Other Than Buildings": {
    defaultUsefulLifeMonths: 240, // 20 years
    isDepreciable: true,
    capitalizationThreshold: 50000,
  },
  "Machinery & Equipment": {
    defaultUsefulLifeMonths: 60, // 5 years (policy range: 3-5 years)
    isDepreciable: true,
    capitalizationThreshold: 5000,
  },
  Vehicles: {
    defaultUsefulLifeMonths: 60, // 5 years
    isDepreciable: true,
    capitalizationThreshold: 5000,
  },
  "Furniture & Fixtures": {
    defaultUsefulLifeMonths: 60, // 5 years — same policy bucket as machinery/vehicles
    isDepreciable: true,
    capitalizationThreshold: 5000,
  },
  "Leasehold Improvements": {
    defaultUsefulLifeMonths: 240, // 20 years, same as Improvements Other Than Buildings
    isDepreciable: true,
    capitalizationThreshold: 50000,
  },
  Infrastructure: {
    defaultUsefulLifeMonths: 240, // 20 years
    isDepreciable: true,
    capitalizationThreshold: 50000,
  },
  "Construction in Progress": {
    defaultUsefulLifeMonths: 0,
    isDepreciable: false,
    capitalizationThreshold: null, // uses final intended asset class threshold
  },
};
