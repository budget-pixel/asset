import Link from "next/link";
import { notFound } from "next/navigation";
import { Decimal } from "@prisma/client/runtime/library";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { formatCurrency, formatDate, formatMonth } from "@/lib/format";
import { resolveActivity } from "@/lib/reporting";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteAssetButton } from "@/components/delete-asset-button";

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [asset, session] = await Promise.all([
    db.asset.findUnique({
      where: { id },
      include: {
        category: true,
        department: { include: { defaultActivity: true } },
        location: true,
        activity: true,
        parentAsset: { select: { id: true, assetTag: true, name: true } },
        additions: {
          orderBy: { assetTag: "asc" },
          include: { depreciationEntries: { orderBy: { periodDate: "desc" }, take: 1 } },
        },
        depreciationEntries: { orderBy: { periodDate: "asc" } },
      },
    }),
    auth(),
  ]);

  if (!asset) notFound();

  const isAdmin = session?.user?.role === "ADMIN";
  const effectiveActivity = resolveActivity(asset);
  const latest = asset.depreciationEntries[asset.depreciationEntries.length - 1];
  const accumulatedDepreciation = latest
    ? new Decimal(latest.accumulatedDepreciation)
    : new Decimal(0);
  const bookValue = latest ? new Decimal(latest.bookValue) : new Decimal(asset.originalCost);

  const additionsWithValues = asset.additions.map((addition) => {
    const additionLatest = addition.depreciationEntries[0];
    return {
      ...addition,
      accumulatedDepreciation: additionLatest
        ? new Decimal(additionLatest.accumulatedDepreciation)
        : new Decimal(0),
      bookValue: additionLatest
        ? new Decimal(additionLatest.bookValue)
        : new Decimal(addition.originalCost),
    };
  });

  const rollupCost = additionsWithValues.reduce(
    (sum, a) => sum.plus(a.originalCost),
    new Decimal(asset.originalCost)
  );
  const rollupAccumulated = additionsWithValues.reduce(
    (sum, a) => sum.plus(a.accumulatedDepreciation),
    accumulatedDepreciation
  );
  const rollupBookValue = additionsWithValues.reduce(
    (sum, a) => sum.plus(a.bookValue),
    bookValue
  );

  return (
    <div className="space-y-6">
      {asset.parentAsset && (
        <div className="rounded-md border border-dashed px-4 py-2 text-sm text-muted-foreground">
          This is an addition to{" "}
          <Link href={`/assets/${asset.parentAsset.id}`} className="font-medium underline">
            {asset.parentAsset.name} ({asset.parentAsset.assetTag})
          </Link>
          .
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{asset.name}</h1>
            <Badge variant={asset.category.isDepreciable ? "default" : "secondary"}>
              {asset.category.name}
            </Badge>
          </div>
          <p className="font-mono text-sm text-muted-foreground">{asset.assetTag}</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              nativeButton={false}
              variant="outline"
              render={<Link href={`/assets/${asset.id}/edit`}>Edit</Link>}
            />
            <DeleteAssetButton assetId={asset.id} />
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Original Cost
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">
            {formatCurrency(asset.originalCost)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Accumulated Depreciation
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">
            {formatCurrency(accumulatedDepreciation)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Book Value
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">
            {formatCurrency(bookValue)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Salvage Value
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">
            {formatCurrency(asset.salvageValue)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
          <div>
            <div className="text-muted-foreground">Department</div>
            <div>{asset.department.name}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Location</div>
            <div>{asset.location.name}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Depreciation Method</div>
            <div>{asset.category.isDepreciable ? "Straight-Line" : "Not Depreciated"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Purchase Date</div>
            <div>{formatDate(asset.purchaseDate)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">In-Service Date</div>
            <div>{formatDate(asset.inServiceDate)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Useful Life</div>
            <div>{asset.usefulLifeMonths} months</div>
          </div>
          <div>
            <div className="text-muted-foreground">GASB Activity</div>
            <div>
              {effectiveActivity ? (
                <>
                  {effectiveActivity.function} — {effectiveActivity.activity}
                  {!asset.activity && (
                    <span className="text-muted-foreground"> (from department)</span>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground">Unassigned</span>
              )}
            </div>
          </div>
          {asset.description && (
            <div className="col-span-full">
              <div className="text-muted-foreground">Description</div>
              <div>{asset.description}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {additionsWithValues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Total Including Additions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <div className="text-sm text-muted-foreground">Original Cost</div>
                <div className="text-xl font-semibold">{formatCurrency(rollupCost)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Accumulated Depreciation</div>
                <div className="text-xl font-semibold">{formatCurrency(rollupAccumulated)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Net Book Value</div>
                <div className="text-xl font-semibold">{formatCurrency(rollupBookValue)}</div>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tag</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>In-Service Date</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Book Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">{asset.assetTag} (original)</TableCell>
                  <TableCell>{asset.name}</TableCell>
                  <TableCell>{formatDate(asset.inServiceDate)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(asset.originalCost)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(bookValue)}</TableCell>
                </TableRow>
                {additionsWithValues.map((addition) => (
                  <TableRow key={addition.id}>
                    <TableCell className="font-mono text-xs">
                      <Link href={`/assets/${addition.id}`} className="hover:underline">
                        {addition.assetTag}
                      </Link>
                    </TableCell>
                    <TableCell>{addition.name}</TableCell>
                    <TableCell>{formatDate(addition.inServiceDate)}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(addition.originalCost)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(addition.bookValue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Depreciation Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          {asset.depreciationEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {asset.category.isDepreciable
                ? "No depreciation posted yet. Run depreciation from the dashboard."
                : "This asset category is not depreciated."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Depreciation</TableHead>
                  <TableHead className="text-right">Accumulated</TableHead>
                  <TableHead className="text-right">Book Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {asset.depreciationEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {entry.isOpeningBalance
                        ? `Opening Balance (as of ${formatMonth(entry.periodDate)})`
                        : formatMonth(entry.periodDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(entry.depreciationAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(entry.accumulatedDepreciation)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(entry.bookValue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
