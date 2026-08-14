"use client";

import { useMemo, useState } from "react";
import { CopyButton } from "@/components/shared/CopyButton";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonBlock } from "@/components/shared/SkeletonBlock";
import {
  MATCH_TYPE_DEFINITIONS,
  type MatchType,
} from "@/components/shared/MatchTypeSelector";
import type { MatchTypeResult } from "@/lib/algorithms/matchType";
import { cn } from "@/lib/cn";
import { trackEvent, type ToolName } from "@/lib/analytics";

export interface MatchTypeOutputProps {
  result: MatchTypeResult | null;
  matchTypes: MatchType[];
  showLoading: boolean;
  emptyTitle: string;
  emptyDescription: string;
  tool: ToolName;
  /** True when matchTypes/options/input have changed since `result` was generated - the shown counts are from the last run, not the current settings. */
  isStale?: boolean;
  /** Whether Process can currently run - when false (e.g. no match type selected, or over the line cap), stale copy must not tell the user to click a disabled button. */
  canProcess?: boolean;
}

/**
 * Output blocks + Copy All + flagged list, shared verbatim between Tools 1
 * and 2 (Implementation Plan Phase 3: "Reuse MatchTypeSelector + output
 * blocks from Phase 2").
 */
export function MatchTypeOutput({
  result,
  matchTypes,
  showLoading,
  emptyTitle,
  emptyDescription,
  tool,
  isStale = false,
  canProcess = true,
}: MatchTypeOutputProps) {
  const [labeledCopyAll, setLabeledCopyAll] = useState(true);

  const copyAllText = useMemo(() => {
    if (!result) return "";
    return matchTypes
      .map((type) => {
        const lines = result.results[type] ?? [];
        const body = lines.join("\n");
        return labeledCopyAll
          ? `--- ${MATCH_TYPE_DEFINITIONS[type].label} ---\n${body}`
          : body;
      })
      .join("\n\n");
  }, [result, matchTypes, labeledCopyAll]);

  const showEmptyState = !result && !showLoading;
  const showResult = result && !showLoading;

  return (
    <div>
      {showEmptyState && (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      )}

      {showLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matchTypes.map((type) => (
            <SkeletonBlock key={type} />
          ))}
        </div>
      )}

      {showResult && (
        <div className="flex flex-col gap-6">
          {isStale && (
            <div
              role="status"
              className="rounded-md border border-border-strong bg-surface px-4 py-2 text-sm text-ink-muted"
            >
              {canProcess
                ? "Showing results from before your last change - updating automatically, or click Process now."
                : "Showing results from before your last change."}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-ink-muted">
              <input
                type="checkbox"
                checked={labeledCopyAll}
                onChange={(event) => setLabeledCopyAll(event.target.checked)}
                className="h-4 w-4 accent-signal"
              />
              Include labels in Copy All
            </label>
            <CopyButton
              text={copyAllText}
              label="Copy All"
              variant="primary"
              onCopied={() =>
                trackEvent({ name: "value_action", tool, action: "copy_all" })
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matchTypes.map((type) => {
              const rawLines = result.results[type];
              const isProcessed = rawLines !== undefined;
              const lines = rawLines ?? [];
              const definition = MATCH_TYPE_DEFINITIONS[type];
              return (
                <div
                  key={type}
                  data-testid={`output-block-${type}`}
                  className={cn(
                    "flex flex-col gap-3 rounded-lg border border-border p-4",
                    definition.softClass,
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-ink">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "h-2.5 w-2.5 shrink-0 rounded-full",
                          definition.swatchClass,
                        )}
                      />
                      {definition.label} (
                      {isProcessed ? lines.length.toLocaleString() : "…"})
                    </h3>
                    <CopyButton
                      text={lines.join("\n")}
                      onCopied={() =>
                        trackEvent({ name: "value_action", tool, action: "copy" })
                      }
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto rounded-md bg-paper p-2 font-mono text-xs text-ink">
                    {!isProcessed ? (
                      <p className="text-ink-faint">
                        {canProcess
                          ? "Not processed yet - updating automatically, or click Process now."
                          : "Not processed yet."}
                      </p>
                    ) : lines.length === 0 ? (
                      <p className="text-ink-faint">No keywords here.</p>
                    ) : (
                      lines.map((line, index) => <div key={index}>{line}</div>)
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {result.flagged.length > 0 && (
            <details className="rounded-lg border border-flag/40 bg-flag-soft p-4">
              <summary className="cursor-pointer text-sm font-medium text-flag">
                Needs review ({result.flagged.length}) - over 80 characters
              </summary>
              <ul className="mt-2 space-y-1 font-mono text-xs text-ink">
                {result.flagged.map((line, index) => (
                  <li key={index}>{line}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
