import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ACTIVITY_TAXONOMY } from "../src/lib/activity-taxonomy";
import { CATEGORY_DEFAULTS } from "../src/lib/category-defaults";

const db = new PrismaClient();

async function main() {
  const categories = await Promise.all(
    Object.entries(CATEGORY_DEFAULTS).map(([name, defaults]) =>
      db.assetCategory.upsert({
        where: { name },
        update: defaults,
        create: { name, ...defaults },
      })
    )
  );

  // GASB 34 / Florida Uniform Accounting System function & activity taxonomy, used for
  // the county's "Capital Assets by Function and Activity" note disclosure schedule.
  await Promise.all(
    ACTIVITY_TAXONOMY.map((a) =>
      db.activity.upsert({
        where: { function_activity: { function: a.function, activity: a.activity } },
        update: {},
        create: a,
      })
    )
  );

  const [hq, warehouse] = await Promise.all([
    db.location.upsert({
      where: { name: "Headquarters" },
      update: {},
      create: { name: "Headquarters", address: "100 Main St, Springfield" },
    }),
    db.location.upsert({
      where: { name: "Warehouse" },
      update: {},
      create: { name: "Warehouse", address: "200 Industrial Pkwy, Springfield" },
    }),
  ]);

  const [operations, it, facilities] = await Promise.all([
    db.department.upsert({
      where: { code: "OPS" },
      update: {},
      create: { name: "Operations", code: "OPS" },
    }),
    db.department.upsert({
      where: { code: "IT" },
      update: {},
      create: { name: "Information Technology", code: "IT" },
    }),
    db.department.upsert({
      where: { code: "FAC" },
      update: {},
      create: { name: "Facilities", code: "FAC" },
    }),
  ]);

  const byName = (name: string) => categories.find((c) => c.name === name)!;

  const passwordHash = await bcrypt.hash("admin123", 10);
  await db.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin",
      passwordHash,
      role: "ADMIN",
    },
  });

  const sampleAssets = [
    {
      assetTag: "BLD-0001",
      name: "Headquarters Office Building",
      category: byName("Buildings"),
      department: facilities,
      location: hq,
      purchaseDate: new Date("2018-06-01"),
      inServiceDate: new Date("2018-07-01"),
      originalCost: 2500000,
      salvageValue: 250000,
    },
    {
      assetTag: "LND-0001",
      name: "Headquarters Land Parcel",
      category: byName("Land"),
      department: facilities,
      location: hq,
      purchaseDate: new Date("2018-06-01"),
      inServiceDate: new Date("2018-06-01"),
      originalCost: 800000,
      salvageValue: 0,
    },
    {
      assetTag: "VEH-0001",
      name: "Delivery Van #1",
      category: byName("Vehicles"),
      department: operations,
      location: warehouse,
      purchaseDate: new Date("2023-01-15"),
      inServiceDate: new Date("2023-02-01"),
      originalCost: 45000,
      salvageValue: 5000,
    },
    {
      assetTag: "EQP-0001",
      name: "CNC Milling Machine",
      category: byName("Machinery & Equipment"),
      department: operations,
      location: warehouse,
      purchaseDate: new Date("2022-09-01"),
      inServiceDate: new Date("2022-10-01"),
      originalCost: 120000,
      salvageValue: 10000,
    },
    {
      assetTag: "FUR-0001",
      name: "Open Office Workstation Set",
      category: byName("Furniture & Fixtures"),
      department: it,
      location: hq,
      purchaseDate: new Date("2024-01-10"),
      inServiceDate: new Date("2024-02-01"),
      originalCost: 18000,
      salvageValue: 0,
    },
    {
      assetTag: "CIP-0001",
      name: "Warehouse Expansion (In Progress)",
      category: byName("Construction in Progress"),
      department: facilities,
      location: warehouse,
      purchaseDate: new Date("2025-11-01"),
      inServiceDate: new Date("2025-11-01"),
      originalCost: 300000,
      salvageValue: 0,
    },
  ];

  for (const a of sampleAssets) {
    await db.asset.upsert({
      where: { assetTag: a.assetTag },
      update: {},
      create: {
        assetTag: a.assetTag,
        name: a.name,
        categoryId: a.category.id,
        departmentId: a.department.id,
        locationId: a.location.id,
        purchaseDate: a.purchaseDate,
        inServiceDate: a.inServiceDate,
        originalCost: a.originalCost,
        salvageValue: a.salvageValue,
        usefulLifeMonths: a.category.defaultUsefulLifeMonths || 1,
      },
    });
  }

  console.log("Seed complete. Login with admin@example.com / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
