"use client";

import { useEffect } from "react";
import { useUIStore, type ToastVariant } from "@/store/uiStore";
import { cn } from "@/lib/cn";

const VARIANT_STYLES: Record<ToastVariant, string> = {
  info: "border-l-ink-muted",
  success: "border-l-signal",
  warning: "border-l-flag",
  error: "border-l-danger",
};

const VARIANT_LABELS: Record<ToastVariant, string> = {
  info: "Info",
  success: "Success",
  warning: "Warning",
  error: "Error",
};

const AUTO_DISMISS_MS = 4000;

function ToastItem({
  id,
  variant,
  message,
}: {
  id: string;
  variant: ToastVariant;
  message: string;
}) {
  const dismissToast = useUIStore((state) => state.dismissToast);

  useEffect(() => {
    const timer = setTimeout(() => dismissToast(id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [id, dismissToast]);

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md border border-border border-l-4 bg-surface px-4 py-3 shadow-sm",
        VARIANT_STYLES[variant],
      )}
    >
      <span className="sr-only">{VARIANT_LABELS[variant]}:</span>
      <p className="flex-1 text-sm text-ink">{message}</p>
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
