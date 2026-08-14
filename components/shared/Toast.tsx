"use client";

import { useEffect } from "react";
import { useUIStore, type ToastVariant } from "@/store/uiStore";
import { cn } from "@/lib/cn";

const VARIANT_GLYPHS: Record<ToastVariant, string> = {
  info: "i",
  success: "✓",
  warning: "!",
  error: "×",
};

const VARIANT_BADGE_CLASSES: Record<ToastVariant, string> = {
  info: "bg-paper text-ink-muted",
  success: "bg-signal-soft text-signal",
  warning: "bg-flag-soft text-flag",
  error: "bg-danger-soft text-danger",
};

const VARIANT_LABELS: Record<ToastVariant, string> = {
  info: "Info",
  success: "Success",
  warning: "Warning",
  error: "Error",
};

const AUTO_DISMISS_MS = 4000;
// Toasts with an undo-style action stay up longer so there's a fair chance to click it.
const AUTO_DISMISS_WITH_ACTION_MS = 8000;

function ToastItem({
  id,
  variant,
  message,
  action,
}: {
  id: string;
  variant: ToastVariant;
  message: string;
  action?: { label: string; onAction: () => void };
}) {
  const dismissToast = useUIStore((state) => state.dismissToast);

  useEffect(() => {
    const timer = setTimeout(
      () => dismissToast(id),
      action ? AUTO_DISMISS_WITH_ACTION_MS : AUTO_DISMISS_MS,
    );
    return () => clearTimeout(timer);
  }, [id, dismissToast, action]);

  return (
    <div className="flex items-start gap-3 rounded-md border border-border bg-surface px-4 py-3 shadow-sm">
      <span
        aria-hidden="true"
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold",
          VARIANT_BADGE_CLASSES[variant],
        )}
      >
        {VARIANT_GLYPHS[variant]}
      </span>
      <span className="sr-only">{VARIANT_LABELS[variant]}:</span>
      <p className="flex-1 text-sm text-ink">{message}</p>
      {action && (
        <button
          type="button"
          onClick={() => {
            action.onAction();
            dismissToast(id);
          }}
          className="shrink-0 text-sm font-medium text-signal underline underline-offset-2 hover:text-ink"
        >
          {action.label}
        </button>
      )}
      <button
        type="button"
        onClick={() => dismissToast(id)}
        aria-label="Dismiss notification"
        className="text-ink-faint hover:text-ink-muted"
      >
        ×
      </button>
    </div>
  );
}

export function ToastViewport() {
  const toasts = useUIStore((state) => state.toasts);

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-4 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 sm:right-4 sm:left-auto sm:translate-x-0"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem {...toast} />
        </div>
      ))}
    </div>
  );
}
