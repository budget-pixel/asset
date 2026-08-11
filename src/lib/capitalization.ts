/**
 * Whether an asset's original cost meets its category's capitalization
 * threshold, per the county's Capital Asset Policy. A null threshold means
 * the category is "Capitalize All" (e.g. Land, Buildings) with no minimum.
 */
export function meetsCapitalizationThreshold(
  cost: number,
  threshold: number | null
): boolean {
  if (threshold == null) return true;
  return cost >= threshold;
}
