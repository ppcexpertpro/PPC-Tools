"use client";

import { CloseIcon } from "@/components/shared/icons";
import { cn } from "@/lib/cn";

export interface ChipProps {
  label: string;
  onRemove: () => void;
  className?: string;
}

export function Chip({ label, onRemove, className }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-paper py-1 pl-3 pr-1 font-mono text-xs text-ink",
        className,
      )}
    >
      {label}
      {/*
        The visible target stays chip-sized so a dense list of negatives is
        still scannable; `hit-area` extends the tappable region to 40px so it
        is reachable on touch without inflating the chip.
      */}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} from selected negatives`}
        className="hit-area flex h-6 w-6 items-center justify-center rounded-full text-ink-faint transition-[background-color,color,transform] duration-200 ease-out hover:bg-danger-soft hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal active:scale-[0.96]"
      >
        <CloseIcon className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}
