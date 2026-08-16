"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary";

export interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  variant?: ButtonVariant;
  loading?: boolean;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-signal text-white shadow-raised hover:bg-signal-strong disabled:bg-signal/50 disabled:shadow-none",
  secondary:
    "bg-surface text-ink border border-border-strong shadow-raised hover:bg-paper disabled:text-ink-faint disabled:border-border disabled:shadow-none",
};

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      aria-busy={loading || undefined}
      disabled={isDisabled}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium",
        // Named properties rather than `transition-all`: `all` would also
        // animate layout properties, and a transition (not a keyframe) lets a
        // fast double-click retarget mid-flight instead of restarting.
        "transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out",
        // Presses register as a small give. 0.96 is the shallowest scale that
        // still reads as tactile; below ~0.95 it starts to look like a bug.
        "active:scale-[0.96] disabled:active:scale-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
        "disabled:cursor-not-allowed",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}
