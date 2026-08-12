"use client";

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
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-paper py-1 pl-3 pr-1.5 font-mono text-xs text-ink",
        className,
      )}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} from selected negatives`}
        className="flex h-5 w-5 items-center justify-center rounded-full text-ink-faint hover:bg-danger-soft hover:text-danger"
      >
        ×
      </button>
    </span>
  );
}
