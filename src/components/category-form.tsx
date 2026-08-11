"use client";

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCategory, type FormState } from "@/actions/categories";

export function CategoryForm() {
  const [state, formAction, pending] = useActionState<FormState | undefined, FormData>(
    createCategory,
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
        <Label htmlFor="cat-name">Name</Label>
        <Input id="cat-name" name="name" required className="w-56" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cat-life">Default Useful Life (months)</Label>
        <Input
          id="cat-life"
          name="defaultUsefulLifeMonths"
          type="number"
          min="0"
          defaultValue="0"
          required
          className="w-40"
        />
      </div>
      <div className="flex items-center gap-2 pb-2">
        <input id="cat-depreciable" name="isDepreciable" type="checkbox" defaultChecked />
        <Label htmlFor="cat-depreciable">Depreciable</Label>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add Category"}
      </Button>
      {state?.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
