import { Decimal } from "@prisma/client/runtime/library";
import { db } from "@/lib/db";
import { formatCurrency, formatMonth } from "@/lib/format";
import { resolveActivity } from "@/lib/reporting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function DepreciationExpensePage() {
  const entries = await db.depreciationEntry.findMany({
    where: { isOpeningBalance: false },
    include: {
      asset: {
        include: {
          category: true,
          department: { include: { defaultActivity: true } },
          activity: true,
        },
      },
    },
    orderBy: { periodDate: "desc" },
  });

  const byPeriod = new Map<string, Decimal>();
  const byCategory = new Map<string, Decimal>();
  const byDepartment = new Map<string, Decimal>();
  const byFunction = new Map<string, Decimal>();
  let grandTotal = new Decimal(0);

  for (const entry of entries) {
    const amount = new Decimal(entry.depreciationAmount);
    const periodKey = entry.periodDate.toISOString();
    const functionName = resolveActivity(entry.asset)?.function ?? "Unassigned";

    byPeriod.set(periodKey, (byPeriod.get(periodKey) ?? new Decimal(0)).plus(amount));
    byCategory.set(
      entry.asset.category.name,
      (byCategory.get(entry.asset.category.name) ?? new Decimal(0)).plus(amount)
    );
    byDepartment.set(
      entry.asset.department.name,
      (byDepartment.get(entry.asset.department.name) ?? new Decimal(0)).plus(amount)
    );
    byFunction.set(functionName, (byFunction.get(functionName) ?? new Decimal(0)).plus(amount));
    grandTotal = grandTotal.plus(amount);
  }

  const periodRows = [...byPeriod.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Depreciation Expense</h1>
        <p className="text-sm text-muted-foreground">
          Depreciation posted per period, and broken down by category and department.
          Opening balances carried in from migrated assets are excluded here — see the
          Fixed Asset Register for total accumulated depreciation including those.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>By Function</CardTitle>
          </CardHeader>
          <CardContent>
            {byFunction.size === 0 ? (
              <p className="text-sm text-muted-foreground">No depreciation posted yet.</p>
            ) : (
              <div className="divide-y">
                {[...byFunction.entries()].map(([name, amount]) => (
                  <div key={name} className="flex items-center justify-between py-2 text-sm">
                    <span>{name}</span>
                    <span className="font-medium">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By Category</CardTitle>
          </CardHeader>
          <CardContent>
            {byCategory.size === 0 ? (
              <p className="text-sm text-muted-foreground">No depreciation posted yet.</p>
            ) : (
              <div className="divide-y">
                {[...byCategory.entries()].map(([name, amount]) => (
                  <div key={name} className="flex items-center justify-between py-2 text-sm">
                    <span>{name}</span>
                    <span className="font-medium">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By Department</CardTitle>
          </CardHeader>
          <CardContent>
            {byDepartment.size === 0 ? (
              <p className="text-sm text-muted-foreground">No depreciation posted yet.</p>
            ) : (
              <div className="divide-y">
                {[...byDepartment.entries()].map(([name, amount]) => (
                  <div key={name} className="flex items-center justify-between py-2 text-sm">
                    <span>{name}</span>
                    <span className="font-medium">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead className="text-right">Depreciation Expense</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {periodRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground">
                  No depreciation posted yet. Run depreciation from the dashboard.
                </TableCell>
              </TableRow>
            )}
            {periodRows.map(([periodKey, amount]) => (
              <TableRow key={periodKey}>
                <TableCell>{formatMonth(new Date(periodKey))}</TableCell>
                <TableCell className="text-right">{formatCurrency(amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Total</TableCell>
              <TableCell className="text-right">{formatCurrency(grandTotal)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
