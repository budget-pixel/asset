import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { deleteLocation } from "@/actions/locations";
import { LocationForm } from "@/components/location-form";
import { LookupDeleteButton } from "@/components/lookup-delete-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function LocationsPage() {
  const [locations, session] = await Promise.all([
    db.location.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { assets: true } } },
    }),
    auth(),
  ]);
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Locations</h1>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Add Location</CardTitle>
          </CardHeader>
          <CardContent>
            <LocationForm />
          </CardContent>
        </Card>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Assets</TableHead>
              {isAdmin && <TableHead className="w-24" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.map((l) => (
              <TableRow key={l.id}>
                <TableCell>{l.name}</TableCell>
                <TableCell>{l.address}</TableCell>
                <TableCell>{l._count.assets}</TableCell>
                {isAdmin && (
                  <TableCell>
                    <LookupDeleteButton id={l.id} deleteAction={deleteLocation} />
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
