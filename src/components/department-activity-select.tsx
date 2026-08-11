"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { setDepartmentActivity } from "@/actions/departments";

const INHERIT_VALUE = "__none__";

export function DepartmentActivitySelect({
  departmentId,
  activityId,
  activities,
}: {
  departmentId: string;
  activityId: string | null;
  activities: { id: string; function: string; activity: string }[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      className="h-8 w-full max-w-xs rounded-md border border-input bg-transparent px-2 text-sm disabled:opacity-50"
      value={activityId ?? INHERIT_VALUE}
      disabled={pending}
      onChange={(e) => {
        const value = e.target.value === INHERIT_VALUE ? null : e.target.value;
        startTransition(async () => {
          try {
            await setDepartmentActivity(departmentId, value);
            toast("Activity updated.");
          } catch {
            toast.error("Failed to update activity.");
          }
        });
      }}
    >
      <option value={INHERIT_VALUE}>— Unassigned —</option>
      {activities.map((a) => (
        <option key={a.id} value={a.id}>
          {a.function} — {a.activity}
        </option>
      ))}
    </select>
  );
}
