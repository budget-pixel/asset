import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { deleteCategory } from "@/actions/categories";
import { CategoryForm } from "@/components/category-form";
import { LookupDeleteButton } from "@/components/lookup-delete-button";
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

export default async function CategoriesPage() {
  const [categories, session] = await Promise.all([
    db.assetCategory.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { assets: true } } },
    }),
    auth(),
  ]);
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Asset Categories</h1>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Add Category</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryForm />
          </CardContent>
        </Card>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Default Useful Life</TableHead>
              <TableHead>Depreciable</TableHead>
              <TableHead>Assets</TableHead>
              {isAdmin && <TableHead className="w-24" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.defaultUsefulLifeMonths} months</TableCell>
                <TableCell>
                  <Badge variant={c.isDepreciable ? "default" : "secondary"}>
                    {c.isDepreciable ? "Yes" : "No"}
                  </Badge>
                </TableCell>
                <TableCell>{c._count.assets}</TableCell>
                {isAdmin && (
                  <TableCell>
                    <LookupDeleteButton id={c.id} deleteAction={deleteCategory} />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
