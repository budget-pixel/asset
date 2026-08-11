import Link from "next/link";
import { Decimal } from "@prisma/client/runtime/library";
import { getAssetsWithBookValue } from "@/lib/reporting";
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

export default async function AssetRegisterPage() {
  const assets = await getAssetsWithBookValue();

  const totals = assets.reduce(
    (acc, a) => ({
      cost: acc.cost.plus(a.originalCost),
      accumulated: acc.accumulated.plus(a.accumulatedDepreciation),
      bookValue: acc.bookValue.plus(a.bookValue),
    }),
    { cost: new Decimal(0), accumulated: new Decimal(0), bookValue: new Decimal(0) }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Fixed Asset Register</h1>
          <p className="text-sm text-muted-foreground">
            Original cost, accumulated depreciation, and net book value for every asset.
          </p>
        </div>
        <Button
          nativeButton={false}
          variant="outline"
          render={<Link href="/api/reports/register/csv">Export CSV</Link>}
        />
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tag</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Original Cost</TableHead>
              <TableHead className="text-right">Accumulated Depreciation</TableHead>
              <TableHead className="text-right">Net Book Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell className="font-mono text-xs">{asset.assetTag}</TableCell>
                <TableCell>{asset.name}</TableCell>
                <TableCell>{asset.category.name}</TableCell>
                <TableCell>{asset.department.name}</TableCell>
                <TableCell>{asset.location.name}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(asset.originalCost)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(asset.accumulatedDepreciation)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(asset.bookValue)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={5}>Total</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.cost)}</TableCell>
              <TableCell className="text-right">
                {formatCurrency(totals.accumulated)}
              </TableCell>
              <TableCell className="text-right">{formatCurrency(totals.bookValue)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
