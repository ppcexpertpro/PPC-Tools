"use client";

import Link from "next/link";
import { useCallback, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/*
 * Feeds the cursor's position, in element-local pixels, to the `.spotlight`
 * class's masked gradient border (see app/globals.css).
 *
 * Written straight to the element's inline style rather than held in React
 * state: a pointermove handler that calls setState re-renders the subtree on
 * every mouse sample, and a card lighting up under the cursor is a paint-only
 * effect that should never touch the render path. Custom properties are the
 * cheapest handoff to CSS available - no layout, no compositing change, just
 * a repaint of the gradient.
 */
export function useSpotlight() {
  const onPointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    target.style.setProperty("--spotlight-x", `${event.clientX - rect.left}px`);
    target.style.setProperty("--spotlight-y", `${event.clientY - rect.top}px`);
  }, []);

  return { onPointerMove };
}

export interface SpotlightSurfaceProps {
  href: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/*
 * A link that lights under the cursor and brings no other styling with it -
 * for hosts that already have their own surface treatment. `cn` in this
 * codebase is a plain join rather than tailwind-merge, so a component that
 * baked in `rounded-2xl border bg-surface` would emit both its own classes
 * and the caller's and let stylesheet order decide the winner.
 */
export function SpotlightSurface({ href, className, style, children }: SpotlightSurfaceProps) {
  const spotlight = useSpotlight();

  return (
    <Link href={href} style={style} {...spotlight} className={cn("spotlight", className)}>
      {children}
    </Link>
  );
}
