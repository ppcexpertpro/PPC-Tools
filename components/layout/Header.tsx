import Link from "next/link";
import { ToolSwitcher } from "@/components/layout/ToolSwitcher";
import { LogoMark } from "@/components/shared/LogoMark";

export function Header() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-bold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <LogoMark />
          <span className="flex items-center gap-1">
            <span aria-hidden="true" className="text-signal">
              [
            </span>
            PPC Tools
            <span aria-hidden="true" className="text-signal">
              ]
            </span>
          </span>
        </Link>
        <ToolSwitcher />
      </div>
    </header>
  );
}
