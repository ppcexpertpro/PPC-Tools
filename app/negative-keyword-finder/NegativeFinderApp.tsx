"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Textarea } from "@/components/shared/Textarea";
import { Checkbox } from "@/components/shared/Checkbox";
import { Counter } from "@/components/shared/Counter";
import { CopyButton } from "@/components/shared/CopyButton";
import { Button } from "@/components/shared/Button";
import { CrossToolPrompt } from "@/components/shared/CrossToolPrompt";
import { Dropzone, type DropzoneStatus } from "@/components/shared/Dropzone";
import { EmptyState } from "@/components/shared/EmptyState";
import { KeywordChecklist } from "@/components/shared/KeywordChecklist";
import { SelectedNegativesList } from "@/components/shared/SelectedNegativesList";
import {
  FrequencyTable,
  type SortColumn,
  type SortDirection,
} from "@/components/shared/FrequencyTable";
import {
  MatchTypeSelector,
  type MatchType,
} from "@/components/shared/MatchTypeSelector";
import {
  allSelectableValues,
  buildKeywordList,
} from "@/lib/algorithms/keywordList";
import { convertMatchTypes } from "@/lib/algorithms/matchType";
import type { FrequencyRow, NgramSize } from "@/lib/algorithms/tokenize";
import { detectSearchTermColumn } from "@/lib/file-parsing/columnDetection";
import { allColumnValues } from "@/lib/file-parsing/columns";
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
import { cn } from "@/lib/cn";
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

type View = "list" | "frequency";

/** Column-picker value that reads every column instead of one. */
const ALL_COLUMNS = "__all_columns__";

/** One negative per line, quoted only when a value needs it (phrase match). */
function toCsv(lines: string[]): string {
  return lines
    .map((line) =>
      /[",\n]/.test(line) ? `"${line.replace(/"/g, '""')}"` : line,
    )
    .join("\n");
}

function getExtension(filename: string): string {
  const match = /\.[^.]+$/.exec(filename);
  return match ? match[0].toLowerCase() : "";
}

export function NegativeFinderApp() {
  const [pasteText, setPasteText] = useState("");
  const [fileStage, setFileStage] = useState<FileStage>({ status: "idle" });
  const [fileTerms, setFileTerms] = useState<string[] | null>(null);
  // The uploaded workbook, kept so the user can switch sheets without
  // re-uploading - list-style workbooks put one niche per sheet.
  const [workbook, setWorkbook] = useState<{
    file: File;
    sheetNames: string[];
    sheetName: string;
  } | null>(null);

  const [ngramSizes, setNgramSizes] = useState<NgramSize[]>([1]);
  const [hideStopwords, setHideStopwords] = useState(true);
  // 2, not 3: short negatives like "tv", "uk", "pc" or "5g" are common and
  // were silently hidden. Single letters are still filtered out.
  const [minLength, setMinLength] = useState(2);
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

  const [view, setView] = useState<View>("list");
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
    // The counts only feed the "Word frequency" view - no point tokenizing a
    // 50k-row report nobody has asked to see counted.
    if (view !== "frequency" || !hasContent || ngramSizes.length === 0) return;

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
  }, [view, activeTerms, ngramSizes, hideStopwords, minLength, minFrequency]);

  const keywordList = useMemo(
    () => buildKeywordList(activeTerms),
    [activeTerms],
  );

  const resetFileState = () => {
    setFileStage({ status: "idle" });
    setFileTerms(null);
    setWorkbook(null);
  };

  const resolveColumnTerms = (
    rows: Record<string, string>[],
    column: string,
  ): string[] =>
    column === ALL_COLUMNS
      ? allColumnValues(rows)
      : rows.map((row) => String(row[column] ?? ""));

  const applyDetection = (
    headers: string[],
    rows: Record<string, string>[],
  ) => {
    const detection = detectSearchTermColumn(headers);
    if (detection.status === "found") {
      finishWithTerms(resolveColumnTerms(rows, detection.column));
    } else {
      setFileTerms(null);
      setFileStage({ status: "needs-column", headers, rows });
    }
  };

  const loadExcelSheet = async (file: File, sheetName?: string) => {
    // Dynamically imported so the ~450KB xlsx library only loads for users
    // who actually upload an Excel file (paste and CSV/TXT never need it).
    const { parseExcel } = await import("@/lib/file-parsing/excel");
    const parsed = await parseExcel(file, sheetName);
    setWorkbook({
      file,
      sheetNames: parsed.sheetNames,
      sheetName: parsed.sheetName,
    });
    if (parsed.rows.length === 0 && parsed.headers.every((h) => !h)) {
      setFileTerms(null);
      setFileStage({
        status: "error",
        message: `Sheet '${parsed.sheetName}' is empty - pick another sheet.`,
      });
      return;
    }
    applyDetection(parsed.headers, parsed.rows);
  };

  const handleSheetChange = async (sheetName: string) => {
    if (!workbook) return;
    setFileStage({ status: "reading", text: "Reading sheet…" });
    try {
      await loadExcelSheet(workbook.file, sheetName);
    } catch {
      setFileStage({
        status: "error",
        message: "We couldn't read that sheet - try another one.",
      });
    }
  };

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
    setWorkbook(null);
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
        applyDetection(headers, rows);
        return;
      }

      await loadExcelSheet(file);
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

  const selectAll = () => {
    setSelectedNegatives((current) => [
      ...new Set([...current, ...allSelectableValues(keywordList)]),
    ]);
  };

  const removeAll = () => setSelectedNegatives([]);

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

  const exportLines = useMemo(() => {
    const { results } = convertMatchTypes(
      selectedNegatives,
      [exportMatchType],
      {},
    );
    return results[exportMatchType] ?? [];
  }, [selectedNegatives, exportMatchType]);

  const dropzoneStatus: DropzoneStatus =
    fileStage.status === "reading"
      ? "uploading"
      : fileStage.status === "error"
        ? "error"
        : "idle";

  const hasKeywords = keywordList.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Textarea
          id="neg-finder-input"
          label="Paste search terms"
          value={pasteText}
          onChange={handlePasteChange}
          rows={8}
          placeholder="Paste all keywords here - one per line…"
          countLabel={(count) => `${count} ${count === 1 ? "row" : "rows"}`}
        />
        <div className="flex flex-col gap-3">
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
          {workbook && workbook.sheetNames.length > 1 && (
            <label className="flex flex-col gap-1 text-sm font-medium text-ink">
              Sheet ({workbook.sheetNames.length} in this workbook)
              <select
                value={workbook.sheetName}
                onChange={(event) => void handleSheetChange(event.target.value)}
                className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm font-normal text-ink"
              >
                {workbook.sheetNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          )}
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
                // Remounts per sheet so the picker never shows a column
                // chosen for the previous sheet.
                key={workbook?.sheetName}
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
                <option value={ALL_COLUMNS}>All columns</option>
                {fileStage.headers
                  .filter((header) => header.trim().length > 0)
                  .map((header, index) => (
                    <option key={`${index}-${header}`} value={header}>
                      {header}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section
          aria-labelledby="keywords-heading"
          className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-raised"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2
              id="keywords-heading"
              className="font-display text-sm font-semibold text-ink"
            >
              Keywords:{" "}
              <span className="font-normal text-ink-muted">Found</span>{" "}
              <span className="font-mono tabular-nums">
                {keywordList.length.toLocaleString()}
              </span>
            </h2>
            <div
              role="tablist"
              aria-label="How to show your keywords"
              className="flex gap-1 rounded-lg bg-paper p-1 text-sm"
            >
              {(["list", "frequency"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  role="tab"
                  aria-selected={view === option}
                  onClick={() => setView(option)}
                  className={cn(
                    "rounded-md px-3 py-1 transition-colors duration-150 ease-out",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal",
                    view === option
                      ? "bg-surface font-medium text-ink shadow-raised"
                      : "text-ink-muted hover:text-ink",
                  )}
                >
                  {option === "list" ? "Keyword list" : "Word frequency"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {view === "list" && (
              <Button
                variant="secondary"
                disabled={!hasKeywords}
                onClick={selectAll}
              >
                Select all
              </Button>
            )}
            <Button
              variant="secondary"
              disabled={selectedNegatives.length === 0}
              onClick={removeAll}
            >
              Remove all
            </Button>
          </div>

          <div role="tabpanel" className="min-w-0">
            {!hasContent ? (
              <EmptyState
                title="Your keywords will appear here"
                description="Paste keywords or upload a report, then tick every keyword or word that doesn't fit your product or service."
              />
            ) : view === "list" ? (
              <KeywordChecklist
                entries={keywordList}
                selected={selectedTokensSet}
                onToggle={toggleNegative}
              />
            ) : (
              <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-end gap-6">
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
                      onChange={(event) =>
                        setMinLength(Number(event.target.value) || 1)
                      }
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
                {isTokenizing && !tokenizeResult && (
                  <p role="status" className="text-sm text-ink-muted">
                    Counting words…
                  </p>
                )}
                {tokenizeResult &&
                  ngramSizes.map((size) => (
                    <div key={size} className="flex flex-col gap-2">
                      <h3 className="font-display text-sm font-semibold text-ink">
                        {NGRAM_LABELS[size]}
                      </h3>
                      <FrequencyTable
                        rows={sortedRowsBySize[size] ?? []}
                        selectedTokens={selectedTokensSet}
                        onToggleToken={toggleNegative}
                        sortColumn={sortState[size].column}
                        sortDirection={sortState[size].direction}
                        onSortChange={(column) =>
                          handleSortChange(size, column)
                        }
                      />
                    </div>
                  ))}
              </div>
            )}
          </div>
        </section>

        <section
          aria-labelledby="negatives-heading"
          className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-raised lg:sticky lg:top-4 lg:self-start"
        >
          <h2
            id="negatives-heading"
            className="font-display text-sm font-semibold text-ink"
          >
            Negative keywords:{" "}
            <span className="font-normal text-ink-muted">Selected</span>{" "}
            <span className="font-mono tabular-nums">
              {selectedNegatives.length.toLocaleString()}
            </span>
          </h2>
          <div className="flex flex-wrap gap-2">
            <CopyButton
              text={exportLines.join("\n")}
              label="Copy all"
              variant="primary"
              onCopied={() =>
                trackEvent({ name: "value_action", tool: TOOL, action: "copy" })
              }
            />
            <Button
              variant="secondary"
              disabled={selectedNegatives.length === 0}
              onClick={() => {
                downloadTextFile(
                  "negative-keywords.csv",
                  toCsv(exportLines),
                  "text/csv",
                );
                trackEvent({
                  name: "value_action",
                  tool: TOOL,
                  action: "download",
                });
              }}
            >
              Export
            </Button>
          </div>
          <MatchTypeSelector
            mode="single"
            types={["broad", "phrase", "exact"]}
            selected={exportMatchType}
            onChange={setExportMatchType}
            legend="Export match type"
          />
          {selectedNegatives.length === 0 ? (
            <p className="text-sm text-ink-muted">
              Tick keywords or words on the left - they collect here, ready to
              copy into your campaign&apos;s negative keywords.
            </p>
          ) : (
            <SelectedNegativesList
              values={selectedNegatives}
              onRemove={toggleNegative}
            />
          )}
          {selectedNegatives.length > 0 && (
            <CrossToolPrompt
              message="Building your negative list into a new campaign? Format it as exact/phrase match with the Keyword Match Type Tool →"
              href="/keyword-match-type"
              linkText="Keyword Match Type"
            />
          )}
        </section>
      </div>
    </div>
  );
}
