/**
 * Computes the next available addition tag for a parent asset, e.g. parent "9071"
 * with existing additions "9071-01", "9071-02" -> "9071-03". Only counts tags that
 * actually match the "{parentTag}-NN" shape; anything else is ignored rather than
 * breaking the sequence.
 */
export function computeNextAdditionTag(parentTag: string, existingChildTags: string[]): string {
  const prefix = `${parentTag}-`;
  let max = 0;
  for (const tag of existingChildTags) {
    if (!tag.startsWith(prefix)) continue;
    const n = parseInt(tag.slice(prefix.length), 10);
    if (!Number.isNaN(n)) max = Math.max(max, n);
  }
  return `${prefix}${String(max + 1).padStart(2, "0")}`;
}
