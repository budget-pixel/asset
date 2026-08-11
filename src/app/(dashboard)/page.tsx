import Link from "next/link";
import { Decimal } from "@prisma/client/runtime/library";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAssetsWithBookValue } from "@/lib/reporting";
import { formatCurrency } from "@/lib/format";
import { RunDepreciationButton } from "@/components/run-depreciation-button";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const [assets, session] = await Promise.all([getAssetsWithBookValue(), auth()]);
  const isAdmin = session?.user?.role === "ADMIN";

  const topLevelCount = assets.filter((a) => a.parentAssetId === null).length;
  const additionsCount = assets.length - topLevelCount;

  const totalCost = assets.reduce((sum, a) => sum.plus(a.originalCost), new Decimal(0));
  const totalAccumulated = assets.reduce(
    (sum, a) => sum.plus(a.accumulatedDepreciation),
    new Decimal(0)
  );
  const totalBookValue = assets.reduce((sum, a) => sum.plus(a.bookValue), new Decimal(0));

  const byCategory = new Map<string, { count: number; bookValue: Decimal }>();
  for (const asset of assets) {
    const key = asset.category.name;
    const existing = byCategory.get(key) ?? { count: 0, bookValue: new Decimal(0) };
    byCategory.set(key, {
      count: existing.count + 1,
      bookValue: existing.bookValue.plus(asset.bookValue),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        {isAdmin && <RunDepreciationButton />}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{assets.length}</div>
            {additionsCount > 0 && (
              <div className="text-xs text-muted-foreground">
                {topLevelCount} distinct assets, {additionsCount} linked additions
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Original Cost
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCurrency(totalCost)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Accumulated Depreciation
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCurrency(totalAccumulated)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Book Value
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCurrency(totalBookValue)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Net Book Value by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {byCategory.size === 0 ? (
            <p className="text-sm text-muted-foreground">No assets yet.</p>
          ) : (
            <div className="divide-y">
              {[...byCategory.entries()].map(([name, data]) => (
                <div key={name} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    {name} <span className="text-muted-foreground">({data.count})</span>
                  </span>
                  <span className="font-medium">{formatCurrency(data.bookValue)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        {isAdmin && (
          <Button nativeButton={false} render={<Link href="/assets/new">Add Asset</Link>} />
        )}
        <Button
          nativeButton={false}
          variant="outline"
          render={<Link href="/reports/register">View Asset Register</Link>}
        />
      </div>
    </div>
  );
}
