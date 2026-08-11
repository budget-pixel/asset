/**
 * Known abbreviations/acronyms that should stay upper-case rather than being
 * title-cased (GIS, not Gis). Starter list built from the county's actual
 * department and asset data — expected to need corrections as more show up.
 */
const ACRONYMS = new Set(
  [
    "FY",
    "RD",
    "CR",
    "SW",
    "NW",
    "NE",
    "SE",
    "ST",
    "AVE",
    "HWY",
    "BCH",
    "EXT",
    "TDC",
    "FEMA",
    "GIS",
    "HVAC",
    "ADA",
    "US",
    "ROW",
    "UL",
    "RTV",
    "UTV",
    "PR",
    "TA",
    "PO",
    "VIN",
    "EMS",
    "ID",
    "AC",
    "DOT",
    "EOC",
    "IT",
    "HR",
    "GPS",
    "LED",
    "HP",
    "KW",
    "KV",
    "MPH",
    "GVW",
    "GVWR",
    "PTO",
    "SWA",
    "YR",
    "CNC",
    "DFS",
    "LF",
  ].map((a) => a.toUpperCase())
);

/**
 * Title-cases a name while preserving known acronyms — "TAX COLLECTOR OFFICE"
 * -> "Tax Collector Office", "GIS DEPARTMENT" -> "GIS Department". Only
 * touches words that are entirely upper-case; any word already containing a
 * lowercase letter (e.g. "In" in "(In Progress)", or "6x6") is left exactly
 * as-is on the assumption it was already deliberately cased — this makes the
 * function a safe no-op on data that isn't shouting in all caps. Operates on
 * maximal letter runs, so punctuation-joined tokens like "NW/SWA" are handled
 * per-segment.
 */
export function toTitleCase(input: string): string {
  return input.replace(/[A-Za-z]+/g, (word) => {
    if (word !== word.toUpperCase()) return word;

    const upper = word.toUpperCase();
    if (ACRONYMS.has(upper)) return upper;
    return word[0].toUpperCase() + word.slice(1).toLowerCase();
  });
}
