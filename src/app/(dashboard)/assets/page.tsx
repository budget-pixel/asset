import Link from "next/link";
import { auth } from "@/lib/auth";
import { getAssetsWithBookValue, type AssetSortColumn } from "@/lib/reporting";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AssetSearchInput } from "@/components/asset-search-input";
import { AssetSortLink } from "@/components/asset-sort-link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SORT_COLUMNS: AssetSortColumn[] = ["assetTag", "name", "category", "department"];

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; dir?: string }>;
}) {
  const params = await searchParams;
  const search = params.q ?? "";
  const sortBy = SORT_COLUMNS.includes(params.sort as AssetSortColumn)
    ? (params.sort as AssetSortColumn)
    : "assetTag";
  const sortDir = params.dir === "desc" ? "desc" : "asc";

  const [assets, session] = await Promise.all([
    getAssetsWithBookValue({ search, sortBy, sortDir }),
    auth(),
  ]);
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Assets</h1>
        {isAdmin && (
          <Button nativeButton={false} render={<Link href="/assets/new">Add Asset</Link>} />
        )}
      </div>

      <AssetSearchInput initialValue={search} />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <AssetSortLink
                  column="assetTag"
                  label="Tag"
                  search={search}
                  currentSort={sortBy}
                  currentDir={sortDir}
                />
              </TableHead>
              <TableHead>
                <AssetSortLink
                  column="name"
                  label="Name"
                  search={search}
                  currentSort={sortBy}
                  currentDir={sortDir}
                />
              </TableHead>
              <TableHead>
                <AssetSortLink
                  column="category"
                  label="Category"
                  search={search}
                  currentSort={sortBy}
                  currentDir={sortDir}
                />
              </TableHead>
              <TableHead>
                <AssetSortLink
                  column="department"
                  label="Department"
                  search={search}
                  currentSort={sortBy}
                  currentDir={sortDir}
                />
              </TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Original Cost</TableHead>
              <TableHead className="text-right">Net Book Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  {search ? `No assets match "${search}".` : "No assets recorded yet."}
                </TableCell>
              </TableRow>
            )}
            {assets.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell className="font-mono text-xs">
                  <Link href={`/assets/${asset.id}`} className="hover:underline">
                    {asset.assetTag}
                  </Link>
                </TableCell>
                <TableCell>{asset.name}</TableCell>
                <TableCell>
                  <Badge variant={asset.category.isDepreciable ? "default" : "secondary"}>
                    {asset.category.name}
                  </Badge>
                </TableCell>
                <TableCell>{asset.department.name}</TableCell>
                <TableCell>{asset.location.name}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(asset.originalCost)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(asset.bookValue)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
