"use client";

import { Button } from "@/components/ui/button";
import { signOutAction } from "@/actions/auth-signout";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="outline" size="sm">
        Sign out
      </Button>
    </form>
  );
}
