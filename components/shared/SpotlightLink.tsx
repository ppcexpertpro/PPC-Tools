import type { CSSProperties, ReactNode } from "react";
import { SpotlightSurface } from "@/components/shared/Spotlight";
import { cn } from "@/lib/cn";

export interface SpotlightLinkProps {
  href: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/*
 * The standard card link: raised surface, lifts on hover, border lights under
 * the cursor. Use SpotlightSurface directly where the host already has its own
 * surface treatment.
 *
 * Not a client component itself - only the pointer handling inside
 * SpotlightSurface is, so `children` stays a server-rendered subtree.
 */
export function SpotlightLink({ href, className, style, children }: SpotlightLinkProps) {
  return (
    <SpotlightSurface
      href={href}
      style={style}
      className={cn(
        "block rounded-2xl border border-border bg-surface shadow-raised",
        "transition-[box-shadow,transform,border-color] duration-300 ease-out",
        "hover:-translate-y-0.5 hover:shadow-lifted",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
        className,
      )}
    >
      {children}
    </SpotlightSurface>
  );
}
