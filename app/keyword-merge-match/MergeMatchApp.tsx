"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { Button } from "@/components/shared/Button";
import { Checkbox } from "@/components/shared/Checkbox";
import { Counter } from "@/components/shared/Counter";
import { CrossToolPrompt } from "@/components/shared/CrossToolPrompt";
import { GroupCard, type MergeGroupData } from "@/components/shared/GroupCard";
import { MatchTypeOutput } from "@/components/shared/MatchTypeOutput";
import {
  MatchTypeSelector,
  sameMatchTypes,
  type MatchType,
} from "@/components/shared/MatchTypeSelector";
import type { MergeOptions } from "@/lib/algorithms/merge";
import { MAX_MERGE_COMBINATIONS } from "@/lib/algorithms/merge";
import type { MatchTypeResult } from "@/lib/algorithms/matchType";
import { countNonBlankLines, splitLines } from "@/lib/validation/lineCount";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { runWorkerTask } from "@/lib/workers/runWorkerTask";
import { createMergeWorker } from "@/lib/workers/mergeWorkerClient";
import type {
  MergeWorkerRequest,
  MergeWorkerResponse,
} from "@/lib/workers/merge.worker";
import { useUIStore } from "@/store/uiStore";
import { bucketInputSize, trackEvent } from "@/lib/analytics";

const TOOL = "keyword-merge-match" as const;
const MAX_GROUPS = 5;
const MIN_GROUPS = 2;
const WARNING_THRESHOLD = MAX_MERGE_COMBINATIONS * 0.8;
const LOADING_THRESHOLD_MS = 300;
const GROUPS_DEBOUNCE_MS = 150;
// APP-FLOW §2: suggestion appears "after a large merged list is generated".
const LARGE_RESULT_THRESHOLD = 20;

const DEFAULT_MATCH_TYPES: MatchType[] = ["broad"];
const DEFAULT_OPTIONS: MergeOptions = {
  lowercase: false,
  removeExtraSymbols: false,
  removeDuplicates: true,
};

function createGroup(index: number): MergeGroupData {
  return { id: crypto.randomUUID(), label: `Group ${index}`, value: "" };
}

interface ProcessedSnapshot {
  groups: MergeGroupData[];
  matchTypes: MatchType[];
  options: MergeOptions;
}

export function MergeMatchApp() {
  const [groups, setGroups] = useState<MergeGroupData[]>(() => [
    createGroup(1),
    createGroup(2),
  ]);
  const [matchTypes, setMatchTypes] =
    useState<MatchType[]>(DEFAULT_MATCH_TYPES);
  const [options, setOptions] = useState<MergeOptions>(DEFAULT_OPTIONS);
  const [result, setResult] = useState<MatchTypeResult | null>(null);
  const [processedSnapshot, setProcessedSnapshot] =
    useState<ProcessedSnapshot | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const showToast = useUIStore((store) => store.showToast);

  const debouncedGroups = useDebouncedValue(groups, GROUPS_DEBOUNCE_MS);
  const nonEmptyCounts = useMemo(
    () =>
      debouncedGroups
        .map((group) => countNonBlankLines(group.value))
        .filter((count) => count > 0),
    [debouncedGroups],
  );
  const hasEnoughGroups = nonEmptyCounts.length >= 2;
  const predictedCount = hasEnoughGroups
    ? nonEmptyCounts.reduce((product, count) => product * count, 1)
    : 0;
  const overCap = hasEnoughGroups && predictedCount > MAX_MERGE_COMBINATIONS;
  const nearCap =
    hasEnoughGroups && !overCap && predictedCount >= WARNING_THRESHOLD;

  const canProcess = hasEnoughGroups && !overCap && matchTypes.length > 0;

  useEffect(() => {
    trackEvent({
      name: "tool_view",
      tool: TOOL,
      referrer: document.referrer,
    });
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    if (!isProcessing) return;
    const timer = setTimeout(() => setShowLoading(true), LOADING_THRESHOLD_MS);
    return () => clearTimeout(timer);
  }, [isProcessing]);

  const wasOverCapRef = useRef(false);
  useEffect(() => {
    if (overCap && !wasOverCapRef.current) {
      trackEvent({ name: "limit_hit", tool: TOOL, limitType: "merge_cap" });
    }
    wasOverCapRef.current = overCap;
  }, [overCap]);

  const addGroup = () => {
    if (groups.length >= MAX_GROUPS) return;
    setGroups((current) => [...current, createGroup(current.length + 1)]);
  };

  const removeGroup = (id: string) => {
    if (groups.length <= MIN_GROUPS) return;
    const index = groups.findIndex((group) => group.id === id);
    if (index === -1) return;
    const removed = groups[index];
    setGroups((current) => current.filter((group) => group.id !== id));
    showToast("info", `Removed ${removed.label}.`, {
      label: "Undo",
      onAction: () => {
        setGroups((current) => {
          if (current.some((group) => group.id === removed.id)) return current;
          const restoreIndex = Math.min(index, current.length);
          const next = [...current];
          next.splice(restoreIndex, 0, removed);
          return next;
        });
      },
    });
  };

  const updateGroupLabel = (id: string, label: string) => {
    setGroups((current) =>
      current.map((group) => (group.id === id ? { ...group, label } : group)),
    );
  };

  const updateGroupValue = (id: string, value: string) => {
    setGroups((current) =>
      current.map((group) => (group.id === id ? { ...group, value } : group)),
    );
  };

  const moveGroup = (fromIndex: number, toIndex: number) => {
    setGroups((current) => {
      if (toIndex < 0 || toIndex >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleDragStart = (id: string) => () => setDraggingId(id);
  const handleDragEnd = () => setDraggingId(null);
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };
  const handleDrop =
    (targetId: string) => (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!draggingId || draggingId === targetId) return;
      setGroups((current) => {
        const fromIndex = current.findIndex((group) => group.id === draggingId);
        const toIndex = current.findIndex((group) => group.id === targetId);
        if (fromIndex === -1 || toIndex === -1) return current;
        const next = [...current];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next;
      });
      setDraggingId(null);
    };

  const handleProcess = async () => {
    if (!canProcess || isProcessing) return;
    setIsProcessing(true);
    try {
      if (!workerRef.current) {
        workerRef.current = createMergeWorker();
      }
      const request: MergeWorkerRequest = {
        groups: groups.map((group) => ({
          label: group.label,
          lines: splitLines(group.value),
        })),
        mergeOptions: options,
        matchTypes,
      };
      const response = await runWorkerTask<
        MergeWorkerRequest,
        MergeWorkerResponse
      >(workerRef.current, request);

      if (response.status === "needs-more-groups") {
        showToast("warning", "Add at least one more group to merge.");
        return;
      }
      if (response.status === "too-many-combinations") {
        showToast(
          "error",
          `That would generate ${response.predictedCount.toLocaleString()} keywords - reduce group sizes below ${MAX_MERGE_COMBINATIONS.toLocaleString()}.`,
        );
        return;
      }
      setResult(response);
      setProcessedSnapshot({ groups, matchTypes, options });
      trackEvent({
        name: "process_run",
        tool: TOOL,
        inputSizeBucket: bucketInputSize(predictedCount),
        options: Object.entries(options)
          .filter(([, enabled]) => enabled)
          .map(([key]) => key),
      });
    } catch {
      showToast(
        "error",
        "Something went wrong processing your list - try again or reduce the list size.",
      );
      trackEvent({
        name: "error_occurred",
        tool: TOOL,
        errorClass: "worker_crash",
      });
    } finally {
      setIsProcessing(false);
      setShowLoading(false);
    }
  };

  const isStale =
    result !== null &&
    processedSnapshot !== null &&
    (JSON.stringify(groups) !== JSON.stringify(processedSnapshot.groups) ||
      !sameMatchTypes(matchTypes, processedSnapshot.matchTypes) ||
      JSON.stringify(options) !== JSON.stringify(processedSnapshot.options));

  // Live processing (debounced via the same `debouncedGroups` that drives
  // the "Will generate N keywords" counter): the Merge & Process button
  // stays as an explicit "run now" trigger, but output keeps itself current
  // on its own so it can never go stale the way a manual-only gate can.
  useEffect(() => {
    if (!canProcess || isProcessing) return;
    const timer = setTimeout(() => void handleProcess(), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedGroups, matchTypes, options]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
        {groups.map((group, index) => (
          <GroupCard
            key={group.id}
            group={group}
            index={index}
            totalGroups={groups.length}
            onLabelChange={(label) => updateGroupLabel(group.id, label)}
            onValueChange={(value) => updateGroupValue(group.id, value)}
            onRemove={() => removeGroup(group.id)}
            onMoveUp={() => moveGroup(index, index - 1)}
            onMoveDown={() => moveGroup(index, index + 1)}
            onDragStart={handleDragStart(group.id)}
            onDragOver={handleDragOver}
            onDrop={handleDrop(group.id)}
            onDragEnd={handleDragEnd}
            isDragging={draggingId === group.id}
            canRemove={groups.length > MIN_GROUPS}
          />
        ))}
        <Button
          variant="secondary"
          onClick={addGroup}
          disabled={groups.length >= MAX_GROUPS}
          className="h-auto self-start"
        >
          + Add group
        </Button>
      </div>

      {!hasEnoughGroups && (
        <Counter state="neutral">Add at least one more group to merge.</Counter>
      )}
      {hasEnoughGroups && !overCap && (
        <Counter state={nearCap ? "warning" : "neutral"}>
          Will generate {predictedCount.toLocaleString()}{" "}
          {predictedCount === 1 ? "keyword" : "keywords"}.
        </Counter>
      )}
      {overCap && (
        <Counter state="error">
          Reduce group sizes - currently would generate{" "}
          {predictedCount.toLocaleString()} keywords, max is{" "}
          {MAX_MERGE_COMBINATIONS.toLocaleString()}.
        </Counter>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-ink">Utility options</p>
          <Checkbox
            id="merge-opt-dedupe"
            label="Remove duplicate resulting keywords"
            description="Case-insensitive"
            checked={!!options.removeDuplicates}
            onChange={(value) =>
              setOptions((current) => ({ ...current, removeDuplicates: value }))
            }
          />
          <Checkbox
            id="merge-opt-lowercase"
            label="Lowercase transform"
            checked={!!options.lowercase}
            onChange={(value) =>
              setOptions((current) => ({ ...current, lowercase: value }))
            }
          />
          <Checkbox
            id="merge-opt-symbols"
            label="Remove extra symbols"
            description="Collapses whitespace, strips disallowed characters"
            checked={!!options.removeExtraSymbols}
            onChange={(value) =>
              setOptions((current) => ({
                ...current,
                removeExtraSymbols: value,
              }))
            }
          />
        </div>

        <div className="flex flex-col gap-6">
          <MatchTypeSelector
            mode="multi"
            selected={matchTypes}
            onChange={setMatchTypes}
          />
          {matchTypes.length === 0 && (
            <Counter state="warning">
              Select at least one match type to process.
            </Counter>
          )}
          <Button
            onClick={() => void handleProcess()}
            disabled={!canProcess}
            loading={isProcessing && showLoading}
          >
            Merge &amp; Process
          </Button>
        </div>
      </div>

      <MatchTypeOutput
        result={result}
        matchTypes={matchTypes}
        showLoading={showLoading}
        isStale={isStale}
        canProcess={canProcess}
        emptyTitle="Your merged keywords will appear here"
        emptyDescription="Fill in at least two groups and choose your match types - results update automatically (or click Merge & Process to run immediately)."
        tool={TOOL}
      />

      {result && result.validCount >= LARGE_RESULT_THRESHOLD && (
        <CrossToolPrompt
          message="Once these are live, mine your search terms report for negatives →"
          href="/negative-keyword-finder"
          linkText="Negative Keyword Finder"
        />
      )}
    </div>
  );
}
