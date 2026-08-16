"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TOOLS = [
  { href: "/keyword-match-type", label: "Match Type" },
  { href: "/keyword-merge-match", label: "Merge & Match" },
  { href: "/negative-keyword-finder", label: "Neg. Finder" },
];

export function ToolSwitcher() {
  const pathname = usePathname();

  return (
    <nav aria-label="Tools" className="flex flex-wrap gap-1">
      {TOOLS.map((tool) => {
        const isActive = pathname === tool.href;
        return (
          <Link
            key={tool.href}
            href={tool.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex min-h-10 items-center rounded-md px-3 text-sm font-medium",
              "transition-[background-color,color,transform] duration-200 ease-out active:scale-[0.96]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
              isActive
                ? "bg-signal-soft text-signal-strong"
                : "text-ink-muted hover:bg-paper hover:text-ink",
            )}
          >
            {tool.label}
          </Link>
        );
      })}
    </nav>
  );
}
