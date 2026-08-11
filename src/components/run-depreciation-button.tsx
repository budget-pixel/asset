"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { runMonthlyDepreciation } from "@/actions/depreciation";

export function RunDepreciationButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            const result = await runMonthlyDepreciation();
            toast(
              result.posted === 0
                ? "Everything is already up to date."
                : `Posted ${result.posted} depreciation ${result.posted === 1 ? "entry" : "entries"}.`
            );
          } catch {
            toast.error("Failed to run depreciation.");
          }
        })
      }
    >
      {pending ? "Running..." : "Run Depreciation"}
    </Button>
  );
}
