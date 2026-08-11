"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { renameDepartment } from "@/actions/departments";

export function DepartmentNameEditor({
  departmentId,
  name,
}: {
  departmentId: string;
  name: string;
}) {
  const [value, setValue] = useState(name);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === name) {
      setValue(name);
      return;
    }
    startTransition(async () => {
      try {
        await renameDepartment(departmentId, trimmed);
        toast("Department renamed.");
      } catch (e) {
        setValue(name);
        toast.error(e instanceof Error ? e.message : "Failed to rename department.");
      }
    });
  };

  return (
    <Input
      ref={inputRef}
      value={value}
      disabled={pending}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          inputRef.current?.blur();
        } else if (e.key === "Escape") {
          setValue(name);
          inputRef.current?.blur();
        }
      }}
      className="h-8 max-w-xs"
    />
  );
}
