"use client";

import { List, type RowComponentProps } from "react-window";
import type { FrequencyRow } from "@/lib/algorithms/tokenize";
import { ChevronDownIcon } from "@/components/shared/icons";
import { cn } from "@/lib/cn";

export type SortColumn = "token" | "count" | "pctOfRows";
export type SortDirection = "asc" | "desc";

export interface FrequencyTableProps {
  rows: FrequencyRow[];
  selectedTokens: Set<string>;
  onToggleToken: (token: string) => void;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSortChange: (column: SortColumn) => void;
}

interface RowData {
  rows: FrequencyRow[];
  selectedTokens: Set<string>;
  onToggleToken: (token: string) => void;
}

const ROW_HEIGHT = 40;
const MAX_LIST_HEIGHT = 420;

function FrequencyTableRow({
  index,
  style,
  ariaAttributes,
  rows,
  selectedTokens,
  onToggleToken,
}: RowComponentProps<RowData>) {
  const row = rows[index];
  const isSelected = selectedTokens.has(row.token);

  return (
    <div style={style} {...ariaAttributes}>
      <button
        type="button"
        onClick={() => onToggleToken(row.token)}
        aria-pressed={isSelected}
        aria-label={`${row.token}, ${row.count.toLocaleString()} ${row.count === 1 ? "occurrence" : "occurrences"}, ${(row.pctOfRows * 100).toFixed(1)}% of rows`}
        className={cn(
          "grid h-10 w-full grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-border px-3 text-left text-sm",
          "transition-colors duration-150 ease-out hover:bg-paper",
          "focus-visible:outline-none focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-signal",
          isSelected && "bg-signal-soft",
        )}
      >
        <span className="truncate font-mono text-ink">{row.token}</span>
        {/*
          Counts and percentages re-sort and re-render constantly; tabular
          figures keep the two right-hand columns from shivering as they do.
        */}
        <span className="w-16 text-right font-mono tabular-nums text-ink-muted">
          {row.count.toLocaleString()}
        </span>
        <span className="w-16 text-right font-mono tabular-nums text-ink-muted">
          {(row.pctOfRows * 100).toFixed(1)}%
        </span>
      </button>
    </div>
  );
}

function SortableHeader({
  column,
  label,
  align = "left",
  sortColumn,
  sortDirection,
  onSortChange,
}: {
  column: SortColumn;
  label: string;
  align?: "left" | "right";
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSortChange: (column: SortColumn) => void;
}) {
  const isActive = sortColumn === column;
  const sortState = isActive
    ? `, currently sorted ${sortDirection === "asc" ? "ascending" : "descending"}`
    : "";
  return (
    <button
      type="button"
      aria-label={`Sort by ${label}${sortState}`}
      onClick={() => onSortChange(column)}
      className={cn(
        "flex min-h-8 items-center gap-1 rounded-sm text-xs font-medium uppercase tracking-wide text-ink-muted",
        "transition-colors duration-200 ease-out hover:text-ink",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
        align === "right" && "w-16 justify-end",
      )}
    >
      {label}
      {/*
        The caret stays mounted and rotates between directions rather than
        being swapped out, so flipping the sort reads as one continuous move.
      */}
      <ChevronDownIcon
        className={cn(
          "h-3.5 w-3.5 transition-[transform,opacity] duration-200 ease-out",
          isActive ? "opacity-100" : "opacity-0",
          isActive && sortDirection === "asc" && "rotate-180",
        )}
      />
    </button>
  );
}

export function FrequencyTable({
  rows,
  selectedTokens,
  onToggleToken,
  sortColumn,
  sortDirection,
  onSortChange,
}: FrequencyTableProps) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border-strong p-4 text-sm text-ink-muted">
        No tokens match the current filters.
      </p>
    );
  }

  return (
    // `overflow-hidden` so the virtualized rows are clipped by the container's
    // corners instead of squaring them off at the bottom edge.
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-raised">
      <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-border bg-paper px-3 py-2">

        <SortableHeader
          column="token"
          label="Token"
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSortChange={onSortChange}
        />
        <SortableHeader
          column="count"
          label="Count"
          align="right"
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSortChange={onSortChange}
        />
        <SortableHeader
          column="pctOfRows"
          label="% of rows"
          align="right"
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSortChange={onSortChange}
        />
      </div>
      <List
        rowComponent={FrequencyTableRow}
        rowCount={rows.length}
        rowHeight={ROW_HEIGHT}
        rowProps={{ rows, selectedTokens, onToggleToken }}
        style={{ height: Math.min(rows.length * ROW_HEIGHT, MAX_LIST_HEIGHT) }}
      />
    </div>
  );
}
