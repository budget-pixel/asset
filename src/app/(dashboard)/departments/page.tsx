import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { deleteDepartment } from "@/actions/departments";
import { DepartmentForm } from "@/components/department-form";
import { DepartmentActivitySelect } from "@/components/department-activity-select";
import { DepartmentNameEditor } from "@/components/department-name-editor";
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

export default async function DepartmentsPage() {
  const [departments, activities, session] = await Promise.all([
    db.department.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { assets: true } } },
    }),
    db.activity.findMany({ orderBy: [{ function: "asc" }, { activity: "asc" }] }),
    auth(),
  ]);
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Departments</h1>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Add Department</CardTitle>
          </CardHeader>
          <CardContent>
            <DepartmentForm />
          </CardContent>
        </Card>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Assets</TableHead>
              <TableHead>Activity (for GASB disclosure)</TableHead>
              {isAdmin && <TableHead className="w-24" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((d) => (
              <TableRow key={d.id}>
                <TableCell>
                  {isAdmin ? (
                    <DepartmentNameEditor departmentId={d.id} name={d.name} />
                  ) : (
                    d.name
                  )}
                </TableCell>
                <TableCell>{d.code}</TableCell>
                <TableCell>{d._count.assets}</TableCell>
                <TableCell>
                  {isAdmin ? (
                    <DepartmentActivitySelect
                      departmentId={d.id}
                      activityId={d.defaultActivityId}
                      activities={activities}
                    />
                  ) : (
                    "—"
                  )}
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    <LookupDeleteButton id={d.id} deleteAction={deleteDepartment} />
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
