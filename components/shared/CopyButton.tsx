"use client";

import { useEffect, useRef, useState } from "react";
import { copyToClipboard } from "@/lib/clipboard";
import { useUIStore } from "@/store/uiStore";
import { Button, type ButtonProps } from "@/components/shared/Button";

type CopyState = "idle" | "copied" | "manual";

export interface CopyButtonProps {
  text: string;
  label?: string;
  variant?: ButtonProps["variant"];
  className?: string;
}

export function CopyButton({
  text,
  label = "Copy",
  variant = "secondary",
  className,
}: CopyButtonProps) {
  const [state, setState] = useState<CopyState>("idle");
  const showToast = useUIStore((store) => store.showToast);
  const manualRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (state === "manual") {
      manualRef.current?.focus();
      manualRef.current?.select();
    }
  }, [state]);

  useEffect(() => {
    if (state !== "copied") return;
    const timer = setTimeout(() => setState("idle"), 2000);
    return () => clearTimeout(timer);
  }, [state]);

  const handleClick = async () => {
    const result = await copyToClipboard(text);
    if (result.ok) {
      setState("copied");
      showToast("success", "Copied to clipboard");
    } else {
      setState("manual");
      showToast(
        "error",
        "Couldn't copy automatically — select the text below and copy manually",
      );
    }
  };

  return (
    <div className="inline-flex flex-col gap-2">
      <Button
        variant={variant}
        onClick={handleClick}
        className={className}
        disabled={text.length === 0}
      >
        {state === "copied" ? (
          <>
            <span aria-hidden="true">✓</span> Copied!
          </>
        ) : (
          label
        )}
      </Button>
      {state === "manual" && (
        <textarea
          ref={manualRef}
          readOnly
          value={text}
          aria-label="Select this text and copy manually"
          className="w-full rounded-md border border-border-strong bg-surface p-2 font-mono text-xs text-ink"
          rows={4}
        />
      )}
    </div>
  );
}
