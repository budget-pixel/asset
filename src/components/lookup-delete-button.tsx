"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function LookupDeleteButton({
  id,
  deleteAction,
}: {
  id: string;
  deleteAction: (id: string) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await deleteAction(id);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to delete.");
          }
        })
      }
    >
      Delete
    </Button>
  );
}
