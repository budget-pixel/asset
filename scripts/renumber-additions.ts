/**
 * One-time renumber of already-linked addition tags from the alpha suffix Munis used
 * (7213A, 7213B, ...) to the county's preferred numeric-dash format (7213-01, 7213-02,
 * ...), ordered by in-service date within each parent.
 *
 * Usage:
 *   npx tsx scripts/renumber-additions.ts            # dry run, prints the mapping
 *   npx tsx scripts/renumber-additions.ts --apply     # writes the new tags
 */
import { db } from "../src/lib/db";

async function main() {
  const apply = process.argv.includes("--apply");

  const parents = await db.asset.findMany({
    where: { additions: { some: {} } },
    include: { additions: { orderBy: { inServiceDate: "asc" } } },
    orderBy: { assetTag: "asc" },
  });

  const renames: { id: string; oldTag: string; newTag: string }[] = [];
  for (const parent of parents) {
    parent.additions.forEach((addition, index) => {
      const newTag = `${parent.assetTag}-${String(index + 1).padStart(2, "0")}`;
      if (newTag !== addition.assetTag) {
        renames.push({ id: addition.id, oldTag: addition.assetTag, newTag });
      }
    });
  }

  console.log(`${parents.length} parent assets with additions.`);
  console.log(`${renames.length} tags would change.`);
  for (const r of renames.slice(0, 40)) {
    console.log(`  ${r.oldTag}  ->  ${r.newTag}`);
  }
  if (renames.length > 40) console.log(`  ... and ${renames.length - 40} more`);

  if (!apply) {
    console.log("\nDry run only — no changes written. Re-run with --apply to write these renames.");
    return;
  }

  // Two passes: first move everything to a temporary tag to avoid transient unique
  // collisions (e.g. if a rename target happens to equal another addition's current
  // tag), then apply the real new tags.
  await db.$transaction(async (tx) => {
    for (const r of renames) {
      await tx.asset.update({ where: { id: r.id }, data: { assetTag: `__tmp__${r.id}` } });
    }
    for (const r of renames) {
      await tx.asset.update({ where: { id: r.id }, data: { assetTag: r.newTag } });
    }
  });

  console.log(`\nApplied: renamed ${renames.length} addition tags.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
