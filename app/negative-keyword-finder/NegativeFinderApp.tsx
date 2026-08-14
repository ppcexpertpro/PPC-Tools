"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Textarea } from "@/components/shared/Textarea";
import { Checkbox } from "@/components/shared/Checkbox";
import { Chip } from "@/components/shared/Chip";
import { Counter } from "@/components/shared/Counter";
import { CopyButton } from "@/components/shared/CopyButton";
import { Button } from "@/components/shared/Button";
import { CrossToolPrompt } from "@/components/shared/CrossToolPrompt";
import { Dropzone, type DropzoneStatus } from "@/components/shared/Dropzone";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  FrequencyTable,
  type SortColumn,
  type SortDirection,
} from "@/components/shared/FrequencyTable";
import {
  MatchTypeSelector,
  type MatchType,
} from "@/components/shared/MatchTypeSelector";
import { convertMatchTypes } from "@/lib/algorithms/matchType";
import type { FrequencyRow, NgramSize } from "@/lib/algorithms/tokenize";
import { detectSearchTermColumn } from "@/lib/file-parsing/columnDetection";
import { parseCsv } from "@/lib/file-parsing/csv";
import { readTextFile } from "@/lib/file-parsing/txt";
import { splitLines } from "@/lib/validation/lineCount";
import {
  NEG_FINDER_MAX_FILE_SIZE_BYTES,
  NEG_FINDER_MAX_ROWS,
} from "@/lib/validation/limits";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { runWorkerTask } from "@/lib/workers/runWorkerTask";
import { createTokenizeWorker } from "@/lib/workers/tokenizeWorkerClient";
import type {
  TokenizeWorkerRequest,
  TokenizeWorkerResponse,
} from "@/lib/workers/tokenize.worker";
import { downloadTextFile } from "@/lib/download";
import { useUIStore } from "@/store/uiStore";
import { bucketInputSize, trackEvent } from "@/lib/analytics";

const TOOL = "negative-keyword-finder" as const;
const NGRAM_LABELS: Record<NgramSize, string> = {
  1: "Unigrams",
  2: "Bigrams",
  3: "Trigrams",
};
const TOKENIZE_DEBOUNCE_MS = 300;
const ACCEPTED_EXTENSIONS = [".csv", ".xls", ".xlsx", ".txt"];

type FileStage =
  | { status: "idle" }
  | { status: "reading"; text: string }
  | {
      status: "needs-column";
      headers: string[];
      rows: Record<string, string>[];
    }
  | { status: "error"; message: string };

function getExtension(filename: string): string {
  const match = /\.[^.]+$/.exec(filename);
  return match ? match[0].toLowerCase() : "";
}

export function NegativeFinderApp() {
  const [pasteText, setPasteText] = useState("");
  const [fileStage, setFileStage] = useState<FileStage>({ status: "idle" });
  const [fileTerms, setFileTerms] = useState<string[] | null>(null);
  const [sheetNote, setSheetNote] = useState<string | null>(null);

  const [ngramSizes, setNgramSizes] = useState<NgramSize[]>([1]);
  const [hideStopwords, setHideStopwords] = useState(true);
  const [minLength, setMinLength] = useState(3);
  const [minFrequency, setMinFrequency] = useState(1);

  const [tokenizeResult, setTokenizeResult] =
    useState<TokenizeWorkerResponse | null>(null);
  const [isTokenizing, setIsTokenizing] = useState(false);
  const [sortState, setSortState] = useState<
    Record<NgramSize, { column: SortColumn; direction: SortDirection }>
  >({
    1: { column: "count", direction: "desc" },
    2: { column: "count", direction: "desc" },
    3: { column: "count", direction: "desc" },
  });

  const [selectedNegatives, setSelectedNegatives] = useState<string[]>([]);
  const [exportMatchType, setExportMatchType] = useState<MatchType>("broad");

  const workerRef = useRef<Worker | null>(null);
  const showToast = useUIStore((store) => store.showToast);

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

  const debouncedPasteText = useDebouncedValue(pasteText, TOKENIZE_DEBOUNCE_MS);

  const activeTerms = useMemo(() => {
    if (fileTerms) return fileTerms;
    return splitLines(debouncedPasteText);
  }, [fileTerms, debouncedPasteText]);

  const hasContent = activeTerms.some((term) => term.trim().length > 0);

  useEffect(() => {
    // No setState here when there's nothing to tokenize - the render below
    // already gates on `hasContent`, so a stale result just sits unused.
    if (!hasContent || ngramSizes.length === 0) return;

    let cancelled = false;

    (async () => {
      setIsTokenizing(true);
      try {
        if (!workerRef.current) {
          workerRef.current = createTokenizeWorker();
        }
        const request: TokenizeWorkerRequest = {
          terms: activeTerms,
          ngramSizes,
          filters: { hideStopwords, minLength, minFrequency },
        };
        const response = await runWorkerTask<
          TokenizeWorkerRequest,
          TokenizeWorkerResponse
        >(workerRef.current, request);
        if (!cancelled) {
          setTokenizeResult(response);
          trackEvent({
            name: "process_run",
            tool: TOOL,
            inputSizeBucket: bucketInputSize(activeTerms.length),
            options: [
              ...ngramSizes.map((size) => `ngram_${size}`),
              ...(hideStopwords ? ["hide_stopwords"] : []),
            ],
          });
        }
      } catch {
        if (!cancelled) {
          showToast(
            "error",
            "Something went wrong counting words - try again or reduce the list size.",
          );
          trackEvent({
            name: "error_occurred",
            tool: TOOL,
            errorClass: "worker_crash",
          });
        }
      } finally {
        if (!cancelled) setIsTokenizing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTerms, ngramSizes, hideStopwords, minLength, minFrequency]);

  const resetFileState = () => {
    setFileStage({ status: "idle" });
    setFileTerms(null);
    setSheetNote(null);
  };

  const resolveColumnTerms = (
    rows: Record<string, string>[],
    column: string,
  ): string[] => rows.map((row) => row[column] ?? "");

  const finishWithTerms = (terms: string[]) => {
    if (terms.length > NEG_FINDER_MAX_ROWS) {
      setFileStage({
        status: "error",
        message: `Max ${NEG_FINDER_MAX_ROWS.toLocaleString()} rows - this file has ${terms.length.toLocaleString()}.`,
      });
      setFileTerms(null);
      trackEvent({ name: "limit_hit", tool: TOOL, limitType: "row_count" });
      return;
    }
    setFileTerms(terms);
    setPasteText("");
    setFileStage({ status: "idle" });
  };

  const handleFileSelected = async (file: File) => {
    setSheetNote(null);
    setSelectedNegatives([]);

    if (file.size > NEG_FINDER_MAX_FILE_SIZE_BYTES) {
      setFileStage({
        status: "error",
        message: `Max file size is 10MB - this file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`,
      });
      trackEvent({ name: "limit_hit", tool: TOOL, limitType: "file_size" });
      return;
    }

    const extension = getExtension(file.name);
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setFileStage({
        status: "error",
        message:
          "Unsupported file type - upload a .csv, .xls, .xlsx, or .txt file.",
      });
      return;
    }

    setFileStage({ status: "reading", text: "Reading file…" });

    try {
      if (extension === ".txt") {
        const text = await readTextFile(file);
        finishWithTerms(splitLines(text));
        return;
      }

      if (extension === ".csv") {
        const { headers, rows } = await parseCsv(file);
        const detection = detectSearchTermColumn(headers);
        if (detection.status === "found") {
          finishWithTerms(resolveColumnTerms(rows, detection.column));
        } else {
          setFileStage({ status: "needs-column", headers, rows });
        }
        return;
      }

      // .xls / .xlsx - dynamically imported so the ~450KB xlsx library only
      // loads for users who actually upload an Excel file, not on every
      // visit to this route (paste and CSV/TXT paths never need it).
      const { parseExcel } = await import("@/lib/file-parsing/excel");
      const { headers, rows, sheetName } = await parseExcel(file);
      setSheetNote(`Reading first sheet: '${sheetName}'`);
      const detection = detectSearchTermColumn(headers);
      if (detection.status === "found") {
        finishWithTerms(resolveColumnTerms(rows, detection.column));
      } else {
        setFileStage({ status: "needs-column", headers, rows });
      }
    } catch {
      setFileStage({
        status: "error",
        message:
          "We couldn't read this file - check it's a valid CSV/XLS/XLSX.",
      });
      trackEvent({
        name: "error_occurred",
        tool: TOOL,
        errorClass: "file_parse_failure",
      });
    }
  };

  const handleManualColumnSelect = (column: string) => {
    if (fileStage.status !== "needs-column") return;
    finishWithTerms(resolveColumnTerms(fileStage.rows, column));
  };

  const handlePasteChange = (value: string) => {
    setPasteText(value);
    if (fileTerms) {
      resetFileState();
      showToast(
        "info",
        "Switched to your pasted text - the uploaded file is no longer active. Upload it again to bring it back.",
      );
    }
  };

  const toggleNegative = (token: string) => {
    setSelectedNegatives((current) =>
      current.includes(token)
        ? current.filter((existing) => existing !== token)
        : [...current, token],
    );
  };

  const toggleNgram = (size: NgramSize, checked: boolean) => {
    setNgramSizes((current) => {
      if (checked) return [...current, size].sort();
      return current.filter((existing) => existing !== size);
    });
  };

  // Memoized: without this, every render (e.g. clicking one token, which
  // only changes selectedNegatives) re-sorts every visible frequency table
  // from scratch - a real INP cost once token counts get into the thousands.
  const sortedRowsBySize = useMemo(() => {
    const result: Partial<Record<NgramSize, FrequencyRow[]>> = {};
    for (const size of ngramSizes) {
      const rows = tokenizeResult?.[size] ?? [];
      const { column, direction } = sortState[size];
      result[size] = [...rows].sort((a, b) => {
        const compare =
          column === "token"
            ? a.token.localeCompare(b.token)
            : a[column] - b[column];
        return direction === "asc" ? compare : -compare;
      });
    }
    return result;
  }, [tokenizeResult, sortState, ngramSizes]);

  const selectedTokensSet = useMemo(
    () => new Set(selectedNegatives),
    [selectedNegatives],
  );

  const handleSortChange = (size: NgramSize, column: SortColumn) => {
    setSortState((current) => {
      const existing = current[size];
      const direction: SortDirection =
        existing.column === column && existing.direction === "desc"
          ? "asc"
          : "desc";
      return { ...current, [size]: { column, direction } };
    });
  };

  const exportText = useMemo(() => {
    const { results } = convertMatchTypes(
      selectedNegatives,
      [exportMatchType],
      {},
    );
    return (results[exportMatchType] ?? []).join("\n");
  }, [selectedNegatives, exportMatchType]);

  const dropzoneStatus: DropzoneStatus =
    fileStage.status === "reading"
      ? "uploading"
      : fileStage.status === "error"
        ? "error"
        : "idle";

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-4">
          <Textarea
            id="neg-finder-input"
            label="Paste search terms"
            value={pasteText}
            onChange={handlePasteChange}
            rows={10}
            placeholder="One search term per line…"
            countLabel={(count) => `${count} ${count === 1 ? "row" : "rows"}`}
          />
          <Dropzone
            accept={ACCEPTED_EXTENSIONS.join(",")}
            onFileSelected={(file) => void handleFileSelected(file)}
            status={dropzoneStatus}
            statusText={
              fileStage.status === "reading" ? fileStage.text : undefined
            }
            errorMessage={
              fileStage.status === "error" ? fileStage.message : undefined
            }
          />
          {sheetNote && <p className="text-xs text-ink-muted">{sheetNote}</p>}
          {fileTerms && (
            <Counter state="neutral">
              Using {fileTerms.length.toLocaleString()} rows from your uploaded
              file.{" "}
              <button
                type="button"
                onClick={resetFileState}
                className="underline underline-offset-2"
              >
                Clear
              </button>
            </Counter>
          )}

          {fileStage.status === "needs-column" && (
            <div className="rounded-lg border border-flag/40 bg-flag-soft p-4">
              <label
                htmlFor="column-picker"
                className="text-sm font-medium text-ink"
              >
                We couldn&apos;t automatically detect a search term column -
                please select one:
              </label>
              <select
                id="column-picker"
                defaultValue=""
                onChange={(event) =>
                  handleManualColumnSelect(event.target.value)
                }
                className="mt-2 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-ink"
              >
                <option value="" disabled>
                  Choose a column…
                </option>
                {fileStage.headers.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 lg:sticky lg:top-4 lg:self-start">
          <p className="text-sm font-medium text-ink">
            Selected negatives ({selectedNegatives.length})
          </p>
          {selectedNegatives.length === 0 ? (
            <p className="text-sm text-ink-muted">
              Click tokens in the frequency table to add them here.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedNegatives.map((token) => (
                <Chip
                  key={token}
                  label={token}
                  onRemove={() => toggleNegative(token)}
                />
              ))}
            </div>
          )}
          <MatchTypeSelector
            mode="single"
            types={["broad", "phrase", "exact"]}
            selected={exportMatchType}
            onChange={setExportMatchType}
            legend="Export match type"
          />
          <div className="flex flex-wrap gap-2">
            <CopyButton
              text={exportText}
              label="Copy"
              variant="primary"
              onCopied={() =>
                trackEvent({ name: "value_action", tool: TOOL, action: "copy" })
              }
            />
            <Button
              variant="secondary"
              disabled={selectedNegatives.length === 0}
              onClick={() => {
                downloadTextFile("negative-keywords.txt", exportText);
                trackEvent({
                  name: "value_action",
                  tool: TOOL,
                  action: "download",
                });
              }}
            >
              Download .txt
            </Button>
          </div>
          {selectedNegatives.length > 0 && (
            <CrossToolPrompt
              message="Building your negative list into a new campaign? Format it as exact/phrase match with the Keyword Match Type Tool →"
              href="/keyword-match-type"
              linkText="Keyword Match Type"
            />
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-6 rounded-lg border border-border bg-surface p-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-ink">N-grams</p>
          <div className="flex gap-4">
            <Checkbox
              id="ngram-1"
              label="Unigram"
              checked={ngramSizes.includes(1)}
              onChange={(checked) => toggleNgram(1, checked)}
            />
            <Checkbox
              id="ngram-2"
              label="Bigram"
              checked={ngramSizes.includes(2)}
              onChange={(checked) => toggleNgram(2, checked)}
            />
            <Checkbox
              id="ngram-3"
              label="Trigram"
              checked={ngramSizes.includes(3)}
              onChange={(checked) => toggleNgram(3, checked)}
            />
          </div>
        </div>
        <Checkbox
          id="hide-stopwords"
          label="Hide common words"
          checked={hideStopwords}
          onChange={setHideStopwords}
        />
        <label className="flex flex-col gap-1 text-sm text-ink">
          Min length
          <input
            type="number"
            min={1}
            value={minLength}
            onChange={(event) => setMinLength(Number(event.target.value) || 1)}
            className="w-20 rounded-md border border-border-strong bg-surface px-2 py-1 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink">
          Min frequency
          <input
            type="number"
            min={1}
            value={minFrequency}
            onChange={(event) =>
              setMinFrequency(Number(event.target.value) || 1)
            }
            className="w-24 rounded-md border border-border-strong bg-surface px-2 py-1 text-sm"
          />
        </label>
      </div>

      <div className="flex flex-col gap-8">
        {!hasContent && (
          <EmptyState
            title="Your frequency table will appear here"
            description="Paste search terms or upload a report to find negative keyword candidates."
          />
        )}
        {hasContent && isTokenizing && !tokenizeResult && (
          <p role="status" className="text-sm text-ink-muted">
            Counting words…
          </p>
        )}
        {hasContent &&
          tokenizeResult &&
          ngramSizes.map((size) => (
            <div key={size} className="flex flex-col gap-2">
              <h2 className="font-display text-sm font-semibold text-ink">
                {NGRAM_LABELS[size]}
              </h2>
              <FrequencyTable
                rows={sortedRowsBySize[size] ?? []}
                selectedTokens={selectedTokensSet}
                onToggleToken={toggleNegative}
                sortColumn={sortState[size].column}
                sortDirection={sortState[size].direction}
                onSortChange={(column) => handleSortChange(size, column)}
              />
            </div>
          ))}
      </div>
    </div>
  );
}
