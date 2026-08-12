"use client";

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUser, type FormState } from "@/actions/users";

export function UserForm() {
  const [state, formAction, pending] = useActionState<FormState | undefined, FormData>(
    createUser,
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
        <Label htmlFor="user-name">Name</Label>
        <Input id="user-name" name="name" required className="w-40" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="user-username">Username</Label>
        <Input id="user-username" name="username" type="text" required className="w-40" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="user-password">Password</Label>
        <Input
          id="user-password"
          name="password"
          type="password"
          required
          minLength={8}
          className="w-40"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="user-role">Role</Label>
        <select
          id="user-role"
          name="role"
          defaultValue="VIEWER"
          className="h-9 w-32 rounded-md border border-input bg-transparent px-2 text-sm"
        >
          <option value="ADMIN">ADMIN</option>
          <option value="VIEWER">VIEWER</option>
        </select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add User"}
      </Button>
      {state?.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
