import { cn } from "@/lib/cn";

export interface SkeletonBlockProps {
  lines?: number;
  className?: string;
}

/**
 * Only mount this past the ~300ms processing threshold (UX-DESIGN §3.1) -
 * small inputs should render real output before a skeleton would ever show.
 */
export function SkeletonBlock({ lines = 4, className }: SkeletonBlockProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        // Matches the radius and padding of the real output card it stands in
        // for, so nothing shifts when the results swap in.
        "animate-pulse rounded-2xl border border-border bg-surface p-4",
        className,
      )}
    >
      <div className="mb-3 h-4 w-24 rounded bg-border" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="h-3 rounded bg-border"
            style={{ width: `${70 + ((index * 13) % 25)}%` }}
          />
        ))}
      </div>
    </div>
  );
}
