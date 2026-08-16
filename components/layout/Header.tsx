import Link from "next/link";
import { ToolSwitcher } from "@/components/layout/ToolSwitcher";
import { LogoMark } from "@/components/shared/LogoMark";

export function Header() {
  return (
    // Sticky so the tool switcher stays reachable while scrolling a long
    // output list - the header is how you move between tools mid-task.
    //
    // Frosted rather than solid: a long output list scrolling under an opaque
    // bar just vanishes at the seam, whereas a blurred pass-through keeps the
    // bar reading as a layer above the page. `bg-surface` stays as the base
    // declaration so browsers without `backdrop-filter` get an opaque bar
    // instead of unreadable text over live content.
    <header className="sticky top-0 z-40 border-b border-border bg-surface backdrop-blur-lg backdrop-saturate-150 supports-backdrop-filter:bg-surface/80">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md py-1 pr-1 font-display text-lg font-bold text-ink transition-transform duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:scale-[0.96]"
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
