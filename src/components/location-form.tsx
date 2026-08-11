"use client";

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createLocation, type FormState } from "@/actions/locations";

export function LocationForm() {
  const [state, formAction, pending] = useActionState<FormState | undefined, FormData>(
    createLocation,
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
        <Label htmlFor="loc-name">Name</Label>
        <Input id="loc-name" name="name" required className="w-56" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="loc-address">Address</Label>
        <Input id="loc-address" name="address" className="w-72" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add Location"}
      </Button>
      {state?.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
