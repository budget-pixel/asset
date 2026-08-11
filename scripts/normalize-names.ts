/**
 * One-time normalization of Department and Asset names from the Munis ALL CAPS
 * source data into title case (see src/lib/text.ts for the rules — preserves a
 * curated acronym list and lowercases small connecting words).
 *
 * Usage:
 *   npx tsx scripts/normalize-names.ts            # dry run, prints the diff
 *   npx tsx scripts/normalize-names.ts --apply     # writes the changes
 */
import { db } from "../src/lib/db";
import { toTitleCase } from "../src/lib/text";

async function main() {
  const apply = process.argv.includes("--apply");

  const departments = await db.department.findMany();
  const assets = await db.asset.findMany({ select: { id: true, name: true } });

  const deptChanges = departments
    .map((d) => ({ id: d.id, before: d.name, after: toTitleCase(d.name) }))
    .filter((c) => c.before !== c.after);

  const assetChanges = assets
    .map((a) => ({ id: a.id, before: a.name, after: toTitleCase(a.name) }))
    .filter((c) => c.before !== c.after);

  console.log(`Departments: ${deptChanges.length} of ${departments.length} would change.`);
  for (const c of deptChanges) console.log(`  ${c.before}  ->  ${c.after}`);

  console.log(`\nAssets: ${assetChanges.length} of ${assets.length} would change.`);
  for (const c of assetChanges.slice(0, 50)) console.log(`  ${c.before}  ->  ${c.after}`);
  if (assetChanges.length > 50) {
    console.log(`  ... and ${assetChanges.length - 50} more (re-run with --apply to write all)`);
  }

  if (!apply) {
    console.log("\nDry run only — no changes written. Re-run with --apply to write these changes.");
    return;
  }

  for (const c of deptChanges) {
    await db.department.update({ where: { id: c.id }, data: { name: c.after } });
  }
  for (const c of assetChanges) {
    await db.asset.update({ where: { id: c.id }, data: { name: c.after } });
  }
  console.log(
    `\nApplied: updated ${deptChanges.length} department name(s) and ${assetChanges.length} asset name(s).`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
