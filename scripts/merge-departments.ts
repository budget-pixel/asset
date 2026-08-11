/**
 * One-time merge of "Custodial Services", "Facilities", and "Facility Maintenance"
 * into a single "Building & Construction Maintenance" department.
 *
 * Usage:
 *   npx tsx scripts/merge-departments.ts            # dry run, prints what would happen
 *   npx tsx scripts/merge-departments.ts --apply     # writes the changes
 */
import { db } from "../src/lib/db";

const TARGET_NAME = "Building & Construction Maintenance";
const KEEP_NAME = "Facility Maintenance"; // renamed to TARGET_NAME, keeps its id/code
const MERGE_NAMES = ["Custodial Services", "Facilities"]; // reassigned into the target, then deleted

async function main() {
  const apply = process.argv.includes("--apply");

  const keep = await db.department.findUnique({ where: { name: KEEP_NAME } });
  if (!keep) throw new Error(`Department "${KEEP_NAME}" not found.`);

  const toMerge = await db.department.findMany({
    where: { name: { in: MERGE_NAMES } },
    include: { _count: { select: { assets: true } } },
  });

  console.log(`Target: "${KEEP_NAME}" (code ${keep.code}) -> renamed to "${TARGET_NAME}"`);
  for (const d of toMerge) {
    console.log(`  merge in "${d.name}" (code ${d.code}, ${d._count.assets} assets), then delete`);
  }

  if (!apply) {
    console.log("\nDry run only — no changes written. Re-run with --apply to write these changes.");
    return;
  }

  await db.$transaction(async (tx) => {
    await tx.department.update({ where: { id: keep.id }, data: { name: TARGET_NAME } });

    for (const d of toMerge) {
      await tx.asset.updateMany({ where: { departmentId: d.id }, data: { departmentId: keep.id } });
      await tx.department.delete({ where: { id: d.id } });
    }
  });

  const finalCount = await db.asset.count({ where: { departmentId: keep.id } });
  console.log(`\nApplied. "${TARGET_NAME}" now has ${finalCount} assets.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
