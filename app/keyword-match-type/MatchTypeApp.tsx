"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Textarea } from "@/components/shared/Textarea";
import { Button } from "@/components/shared/Button";
import { Checkbox } from "@/components/shared/Checkbox";
import { Counter } from "@/components/shared/Counter";
import { MatchTypeOutput } from "@/components/shared/MatchTypeOutput";
import {
  MatchTypeSelector,
  type MatchType,
} from "@/components/shared/MatchTypeSelector";
import type {
  MatchTypeOptions,
  MatchTypeResult,
} from "@/lib/algorithms/matchType";
import { countNonBlankLines, splitLines } from "@/lib/validation/lineCount";
import {
  MATCH_TYPE_HARD_CAP_LINES,
  getLineCountStatus,
} from "@/lib/validation/limits";
import { runWorkerTask } from "@/lib/workers/runWorkerTask";
import { createMatchTypeWorker } from "@/lib/workers/matchTypeWorkerClient";
import type { MatchTypeWorkerRequest } from "@/lib/workers/matchType.worker";
import { useUIStore } from "@/store/uiStore";

const DEFAULT_MATCH_TYPES: MatchType[] = ["broad"];
const DEFAULT_OPTIONS: MatchTypeOptions = {
  lowercase: false,
  trimExtraWhitespace: false,
  stripSpecialChars: false,
  removeDuplicates: true,
  sortAlphabetically: false,
};
const LOADING_THRESHOLD_MS = 300;

export function MatchTypeApp() {
  const [inputText, setInputText] = useState("");
  const [matchTypes, setMatchTypes] =
    useState<MatchType[]>(DEFAULT_MATCH_TYPES);
  const [options, setOptions] = useState<MatchTypeOptions>(DEFAULT_OPTIONS);
  const [result, setResult] = useState<MatchTypeResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const showToast = useUIStore((store) => store.showToast);

  const lineCount = useMemo(() => countNonBlankLines(inputText), [inputText]);
  const lineCountStatus = getLineCountStatus(lineCount);
  const canProcess =
    lineCount > 0 && matchTypes.length > 0 && lineCountStatus !== "blocked";

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    if (!isProcessing) return;
    const timer = setTimeout(() => setShowLoading(true), LOADING_THRESHOLD_MS);
    return () => clearTimeout(timer);
  }, [isProcessing]);

  const handleProcess = async () => {
    if (!canProcess) return;
    setIsProcessing(true);
    try {
      if (!workerRef.current) {
        workerRef.current = createMatchTypeWorker();
      }
      const request: MatchTypeWorkerRequest = {
        lines: splitLines(inputText),
        selectedTypes: matchTypes,
        options,
      };
      const response = await runWorkerTask<
        MatchTypeWorkerRequest,
        MatchTypeResult
      >(workerRef.current, request);
      setResult(response);
    } catch {
      showToast(
        "error",
        "Something went wrong processing your list — try again or reduce the list size.",
      );
    } finally {
      setIsProcessing(false);
      setShowLoading(false);
    }
  };

  const handleTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void handleProcess();
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Textarea
          id="match-type-input"
          label="Keywords"
          value={inputText}
          onChange={setInputText}
          onKeyDown={handleTextareaKeyDown}
          rows={14}
          placeholder="One keyword per line…"
          error={lineCountStatus === "blocked"}
          errorMessage={
            lineCountStatus === "blocked"
              ? `Max ${MATCH_TYPE_HARD_CAP_LINES.toLocaleString()} lines — you have ${lineCount.toLocaleString()}.`
              : undefined
          }
        />

        <div className="flex flex-col gap-6">
          <MatchTypeSelector
            mode="multi"
            selected={matchTypes}
            onChange={setMatchTypes}
          />

          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-ink">Options</p>
            <Checkbox
              id="opt-dedupe"
              label="Remove duplicate lines"
              description="Case-insensitive"
              checked={!!options.removeDuplicates}
              onChange={(value) =>
                setOptions((current) => ({
                  ...current,
                  removeDuplicates: value,
                }))
              }
            />
            <Checkbox
              id="opt-lowercase"
              label="Lowercase all"
              checked={!!options.lowercase}
              onChange={(value) =>
                setOptions((current) => ({ ...current, lowercase: value }))
              }
            />
            <Checkbox
              id="opt-trim"
              label="Trim extra whitespace"
              checked={!!options.trimExtraWhitespace}
              onChange={(value) =>
                setOptions((current) => ({
                  ...current,
                  trimExtraWhitespace: value,
                }))
              }
            />
            <Checkbox
              id="opt-strip"
              label="Strip special characters"
              description="Keeps letters, numbers, spaces, - ' &"
              checked={!!options.stripSpecialChars}
              onChange={(value) =>
                setOptions((current) => ({
                  ...current,
                  stripSpecialChars: value,
                }))
              }
            />
            <Checkbox
              id="opt-sort"
              label="Sort alphabetically"
              checked={!!options.sortAlphabetically}
              onChange={(value) =>
                setOptions((current) => ({
                  ...current,
                  sortAlphabetically: value,
                }))
              }
            />
          </div>

          {lineCountStatus === "warning" && (
            <Counter state="warning">
              {lineCount.toLocaleString()} keywords — processing may take a
              moment.
            </Counter>
          )}
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
            Process
          </Button>
        </div>
      </div>

      <MatchTypeOutput
        result={result}
        matchTypes={matchTypes}
        showLoading={showLoading}
        emptyTitle="Your formatted keywords will appear here"
        emptyDescription="Paste a list, choose your match types, and click Process (or press Ctrl/Cmd+Enter)."
      />
    </div>
  );
}
