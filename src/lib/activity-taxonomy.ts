/**
 * GASB 34 / Florida Uniform Accounting System function & activity taxonomy, used for
 * the county's "Capital Assets by Function and Activity" note disclosure schedule.
 * Shared between prisma/seed.ts (loads these as Activity rows) and the by-activity
 * report (renders rows in this canonical order, matching the comptroller's schedule).
 */
export const ACTIVITY_TAXONOMY: { function: string; activity: string }[] = [
  { function: "General government", activity: "Finance and administration" },
  { function: "General government", activity: "Comprehensive planning" },
  { function: "General government", activity: "Judicial" },
  { function: "General government", activity: "Other general government" },
  { function: "Public safety", activity: "Law enforcement" },
  { function: "Public safety", activity: "Ambulance service" },
  { function: "Public safety", activity: "Civil defense" },
  { function: "Public safety", activity: "Building inspection" },
  { function: "Public safety", activity: "Emergency 911" },
  { function: "Public safety", activity: "Animal control" },
  { function: "Public safety", activity: "Fire" },
  { function: "Physical environment", activity: "Physical environment" },
  { function: "Transportation", activity: "Transportation" },
  { function: "Economic environment", activity: "Housing authority" },
  { function: "Economic environment", activity: "Tourist development" },
  { function: "Economic environment", activity: "Farmers market" },
  { function: "Human services", activity: "Health" },
  { function: "Human services", activity: "Veterans" },
  { function: "Culture and recreation", activity: "Beach access" },
  { function: "Culture and recreation", activity: "Parks and recreation" },
  { function: "Culture and recreation", activity: "Library" },
];

export const SCHEDULE_COLUMNS = [
  "Land",
  "Buildings",
  "Improvements Other Than Buildings",
  "Machinery & Equipment",
  "Infrastructure",
  "Construction in Progress",
] as const;

export type ScheduleColumn = (typeof SCHEDULE_COLUMNS)[number];

/** Maps our finer-grained asset categories onto the county's 6 disclosure columns. */
export function scheduleColumn(categoryName: string): ScheduleColumn {
  switch (categoryName) {
    case "Land":
      return "Land";
    case "Buildings":
      return "Buildings";
    case "Improvements Other Than Buildings":
      return "Improvements Other Than Buildings";
    case "Infrastructure":
      return "Infrastructure";
    case "Construction in Progress":
      return "Construction in Progress";
    default:
      // Machinery & Equipment, Vehicles, Furniture & Fixtures, Leasehold Improvements
      return "Machinery & Equipment";
  }
}
