"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const SECTIONS = [
  { href: "/outreach", label: "Campaigns" },
  { href: "/outreach/dashboard", label: "Dashboard" },
  { href: "/outreach/mailboxes", label: "Mailboxes" },
  { href: "/outreach/suppressions", label: "Suppressions" },
  { href: "/outreach/events", label: "Events" },
];

/*
 * The palette is the fast path between these pages; this bar is the one that
 * tells a first-time operator the pages exist at all. Suppressions and Events
 * shipped with no inbound link from anywhere, which made them effectively
 * unreachable without typing the URL.
 */
export function OutreachNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Outreach sections" className="flex flex-wrap items-center gap-1">
      {SECTIONS.map((section) => {
        // Campaign detail/edit/enrollment pages live under /outreach/campaigns,
        // so the Campaigns tab owns that whole subtree. Every other section is
        // a leaf and matches exactly - without that, /outreach would light up
        // on every page in the console.
        const isActive =
          section.href === "/outreach"
            ? pathname === "/outreach" || pathname.startsWith("/outreach/campaigns")
            : pathname === section.href;

        return (
          <Link
            key={section.href}
            href={section.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex min-h-9 items-center rounded-md px-3 text-sm font-medium",
              "transition-[background-color,color,transform] duration-200 ease-out active:scale-[0.96]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
              isActive
                ? "bg-signal-soft text-signal-strong"
                : "text-ink-muted hover:bg-surface hover:text-ink",
            )}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
