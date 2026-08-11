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
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
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
