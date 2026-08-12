import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { deleteUser } from "@/actions/users";
import { UserForm } from "@/components/user-form";
import { UserRoleSelect } from "@/components/user-role-select";
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

export default async function UsersPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/");
  }

  const users = await db.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Users</h1>

      <Card>
        <CardHeader>
          <CardTitle>Add User</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm />
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <UserRoleSelect
                    userId={u.id}
                    role={u.role}
                    disabled={u.id === session.user.id}
                  />
                </TableCell>
                <TableCell>
                  {u.id !== session.user.id && (
                    <LookupDeleteButton id={u.id} deleteAction={deleteUser} />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
