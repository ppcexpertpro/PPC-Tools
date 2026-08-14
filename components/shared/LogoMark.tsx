import { cn } from "@/lib/cn";

export interface LogoMarkProps {
  className?: string;
}

/**
 * The suite's mark: brackets are Google Ads exact-match syntax
 * ([keyword]), so "[P]" ties the logo directly to the product domain
 * instead of being arbitrary decoration.
 */
export function LogoMark({ className }: LogoMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-signal font-mono text-sm font-bold text-paper",
        className,
      )}
    >
      [P]
    </span>
  );
}
