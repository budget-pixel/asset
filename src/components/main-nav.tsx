"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/assets", label: "Assets" },
  { href: "/categories", label: "Categories" },
  { href: "/departments", label: "Departments" },
  { href: "/locations", label: "Locations" },
  { href: "/reports/register", label: "Asset Register" },
  { href: "/reports/depreciation-expense", label: "Depreciation Expense" },
  { href: "/reports/by-activity", label: "By Function & Activity" },
];

const adminLinks = [{ href: "/users", label: "Users" }];

export function MainNav({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const allLinks = isAdmin ? [...links, ...adminLinks] : links;

  return (
    <nav className="flex flex-wrap gap-1">
      {allLinks.map((link) => {
        const active =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
              active ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
