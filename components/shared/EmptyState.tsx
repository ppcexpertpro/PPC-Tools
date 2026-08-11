import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
}

const DEFAULT_ICON = (
  <span aria-hidden="true" className="font-mono text-3xl text-ink-faint">
    [&nbsp;]
  </span>
);

export function EmptyState({
  title,
  description,
  icon = DEFAULT_ICON,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-6 py-10 text-center",
        className,
      )}
    >
      {icon}
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-ink-muted">{description}</p>
      )}
    </div>
  );
}
