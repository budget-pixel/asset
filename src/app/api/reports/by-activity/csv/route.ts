import { auth } from "@/lib/auth";
import { getFunctionActivityMatrix } from "@/lib/reporting";
import { SCHEDULE_COLUMNS } from "@/lib/activity-taxonomy";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { rows, unassigned, grandTotal } = await getFunctionActivityMatrix();

  const header = ["Function", "Activity", ...SCHEDULE_COLUMNS, "Total"];
  const allRows = unassigned.total.isZero() ? rows : [...rows, unassigned];

  const csvRows = allRows.map((row) =>
    [
      row.function,
      row.activity,
      ...SCHEDULE_COLUMNS.map((c) => row.columns[c].toString()),
      row.total.toString(),
    ]
      .map((v) => csvEscape(String(v)))
      .join(",")
  );

  csvRows.push(
    [
      "Total governmental funds capital assets",
      "",
      ...SCHEDULE_COLUMNS.map((c) => grandTotal.columns[c].toString()),
      grandTotal.total.toString(),
    ]
      .map((v) => csvEscape(String(v)))
      .join(",")
  );

  const csv = [header.join(","), ...csvRows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="capital-assets-by-function-activity-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
