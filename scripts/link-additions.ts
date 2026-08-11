/**
 * One-time link of capital "addition" assets to the base asset they belong to.
 *
 * The comptroller's old system required every capitalized addition to an existing
 * facility (e.g. an FY19 HVAC replacement on a building) to be entered as its own
 * asset rather than folded into the original's cost — that preserves the dated,
 * itemized addition history GASB's Schedule of Changes in Capital Assets needs.
 * The result is asset tags like 7213, 7213A, 7213B … all for one physical facility.
 * This links them (Asset.parentAssetId) without touching cost, dates, or
 * depreciation — each addition keeps its own full record.
 *
 * Only links high-confidence pairs: assetTag matches `{base}{suffix}`, an asset with
 * assetTag === {base} exists, and the child's name contains "addition". Everything
 * else (tag-suffixed assets with no matching base, or a matching base but a name that
 * doesn't say "addition" — likely just how individual road/infrastructure segments
 * happen to be tagged) is left alone for manual review via the asset edit form.
 *
 * Usage:
 *   npx tsx scripts/link-additions.ts            # dry run, prints the pairs
 *   npx tsx scripts/link-additions.ts --apply     # writes the links
 */
import { db } from "../src/lib/db";

async function main() {
  const apply = process.argv.includes("--apply");

  const assets = await db.asset.findMany({
    select: { id: true, assetTag: true, name: true, parentAssetId: true },
  });
  const byTag = new Map(assets.map((a) => [a.assetTag, a]));

  const pairs: { child: (typeof assets)[number]; parent: (typeof assets)[number] }[] = [];

  for (const asset of assets) {
    const match = asset.assetTag.match(/^(\d+)[A-Z]+$/);
    if (!match) continue;
    if (!asset.name.toLowerCase().includes("addition")) continue;

    const parent = byTag.get(match[1]);
    if (!parent || parent.id === asset.id) continue;

    pairs.push({ child: asset, parent });
  }

  console.log(`${pairs.length} high-confidence addition pairs found.`);
  for (const { child, parent } of pairs.slice(0, 30)) {
    console.log(`  ${child.assetTag} "${child.name}"  ->  ${parent.assetTag} "${parent.name}"`);
  }
  if (pairs.length > 30) console.log(`  ... and ${pairs.length - 30} more`);

  if (!apply) {
    console.log("\nDry run only — no changes written. Re-run with --apply to write these links.");
    return;
  }

  let linked = 0;
  for (const { child, parent } of pairs) {
    if (child.parentAssetId === parent.id) continue; // already linked, idempotent
    await db.asset.update({ where: { id: child.id }, data: { parentAssetId: parent.id } });
    linked++;
  }

  console.log(`\nApplied: linked ${linked} additions (${pairs.length - linked} already linked).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
