"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateUserRole } from "@/actions/users";

export function UserRoleSelect({
  userId,
  role,
  disabled,
}: {
  userId: string;
  role: "ADMIN" | "VIEWER";
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      className="h-8 w-32 rounded-md border border-input bg-transparent px-2 text-sm disabled:opacity-50"
      value={role}
      disabled={pending || disabled}
      onChange={(e) => {
        const value = e.target.value as "ADMIN" | "VIEWER";
        startTransition(async () => {
          try {
            await updateUserRole(userId, value);
            toast("Role updated.");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to update role.");
          }
        });
      }}
    >
      <option value="ADMIN">ADMIN</option>
      <option value="VIEWER">VIEWER</option>
    </select>
  );
}
