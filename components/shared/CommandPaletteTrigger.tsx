"use client";

import { useSyncExternalStore } from "react";
import { SearchIcon } from "@/components/shared/icons";
import { useUIStore } from "@/store/uiStore";

/* The platform never changes mid-session, so there is nothing to subscribe to. */
const noopSubscribe = () => () => {};
const readIsMac = () => /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent);

/*
 * The palette's visible affordance. A keyboard shortcut nobody is told about
 * is not a navigation model, and this is the only nav the outreach console
 * has - so the trigger states the shortcut rather than just implying it.
 *
 * `navigator` doesn't exist on the server, and reading it during the first
 * client render is what produces a hydration mismatch - so the modifier goes
 * through useSyncExternalStore, whose third argument exists precisely to give
 * the server a different answer. It renders the non-Mac label server-side and
 * through hydration, then re-renders once with the real platform. Doing this
 * in an effect instead would work, but it's the pattern `set-state-in-effect`
 * is warning about.
 */
export function CommandPaletteTrigger() {
  const isMac = useSyncExternalStore(noopSubscribe, readIsMac, () => false);
  const open = useUIStore((state) => state.setCommandPaletteOpen);

  return (
    <button
      type="button"
      onClick={() => open(true)}
      className="group flex min-h-10 items-center gap-2 rounded-md border border-border bg-paper px-3 text-sm text-ink-muted transition-[background-color,border-color,color,transform] duration-200 ease-out hover:border-border-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:scale-[0.96]"
    >
      <SearchIcon className="h-4 w-4 flex-none" />
      <span className="hidden sm:inline">Jump to...</span>
      <kbd className="ml-1 hidden rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[0.625rem] text-ink-faint sm:inline">
        {isMac ? "⌘" : "Ctrl "}K
      </kbd>
    </button>
  );
}
