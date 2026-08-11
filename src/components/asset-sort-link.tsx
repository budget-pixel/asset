import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { AssetSortColumn } from "@/lib/reporting";

export function AssetSortLink({
  column,
  label,
  search,
  currentSort,
  currentDir,
}: {
  column: AssetSortColumn;
  label: string;
  search: string;
  currentSort: AssetSortColumn;
  currentDir: "asc" | "desc";
}) {
  const isActive = currentSort === column;
  const nextDir = isActive && currentDir === "asc" ? "desc" : "asc";

  const params = new URLSearchParams();
  if (search) params.set("q", search);
  params.set("sort", column);
  params.set("dir", nextDir);

  return (
    <Link
      href={`/assets?${params.toString()}`}
      className="inline-flex items-center gap-1 hover:text-foreground"
    >
      {label}
      {isActive ? (
        currentDir === "asc" ? (
          <ArrowUp className="size-3.5" />
        ) : (
          <ArrowDown className="size-3.5" />
        )
      ) : (
        <ArrowUpDown className="size-3.5 text-muted-foreground/50" />
      )}
    </Link>
  );
}
