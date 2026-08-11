import { Fragment } from "react";
import Link from "next/link";
import { Decimal } from "@prisma/client/runtime/library";
import { getFunctionActivityMatrix } from "@/lib/reporting";
import { SCHEDULE_COLUMNS } from "@/lib/activity-taxonomy";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ByActivityReportPage() {
  const { rows, unassigned, grandTotal } = await getFunctionActivityMatrix();

  const functions = [...new Set(rows.map((r) => r.function))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Capital Assets by Function &amp; Activity</h1>
          <p className="text-sm text-muted-foreground">
            Original cost by GASB function and activity — matches the structure of the
            county&apos;s note disclosure schedule. Assign activities on the{" "}
            <Link href="/departments" className="underline">
              Departments
            </Link>{" "}
            page.
          </p>
        </div>
        <Button
          nativeButton={false}
          variant="outline"
          render={<Link href="/api/reports/by-activity/csv">Export CSV</Link>}
        />
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Function and Activity</TableHead>
              {SCHEDULE_COLUMNS.map((c) => (
                <TableHead key={c} className="text-right">
                  {c}
                </TableHead>
              ))}
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {functions.map((fn) => {
              const fnRows = rows.filter((r) => r.function === fn);
              const columnTotals = Object.fromEntries(
                SCHEDULE_COLUMNS.map((c) => [
                  c,
                  fnRows.reduce((sum, r) => sum.plus(r.columns[c]), new Decimal(0)),
                ])
              ) as (typeof fnRows)[number]["columns"];
              const rowTotal = fnRows.reduce((sum, r) => sum.plus(r.total), new Decimal(0));

              return (
                <Fragment key={fn}>
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={SCHEDULE_COLUMNS.length + 2} className="font-medium">
                      {fn}
                    </TableCell>
                  </TableRow>
                  {fnRows.map((row) => (
                    <TableRow key={`${row.function}-${row.activity}`}>
                      <TableCell className="pl-6">{row.activity}</TableCell>
                      {SCHEDULE_COLUMNS.map((c) => (
                        <TableCell key={c} className="text-right">
                          {row.columns[c].isZero() ? "—" : formatCurrency(row.columns[c])}
                        </TableCell>
                      ))}
                      <TableCell className="text-right font-medium">
                        {row.total.isZero() ? "—" : formatCurrency(row.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-medium">
                    <TableCell className="pl-6">Total {fn.toLowerCase()}</TableCell>
                    {SCHEDULE_COLUMNS.map((c) => (
                      <TableCell key={c} className="text-right">
                        {formatCurrency(columnTotals[c])}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">{formatCurrency(rowTotal)}</TableCell>
                  </TableRow>
                </Fragment>
              );
            })}
            {!unassigned.total.isZero() && (
              <TableRow className="text-destructive">
                <TableCell className="font-medium">Unassigned</TableCell>
                {SCHEDULE_COLUMNS.map((c) => (
                  <TableCell key={c} className="text-right">
                    {unassigned.columns[c].isZero() ? "—" : formatCurrency(unassigned.columns[c])}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatCurrency(unassigned.total)}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Total governmental funds capital assets</TableCell>
              {SCHEDULE_COLUMNS.map((c) => (
                <TableCell key={c} className="text-right">
                  {formatCurrency(grandTotal.columns[c])}
                </TableCell>
              ))}
              <TableCell className="text-right">{formatCurrency(grandTotal.total)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
