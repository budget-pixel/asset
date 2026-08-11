"use client";

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDepartment, type FormState } from "@/actions/departments";

export function DepartmentForm() {
  const [state, formAction, pending] = useActionState<FormState | undefined, FormData>(
    createDepartment,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="flex flex-wrap items-end gap-3"
    >
      <div className="space-y-2">
        <Label htmlFor="dept-name">Name</Label>
        <Input id="dept-name" name="name" required className="w-56" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dept-code">Code</Label>
        <Input id="dept-code" name="code" required className="w-32" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add Department"}
      </Button>
      {state?.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
