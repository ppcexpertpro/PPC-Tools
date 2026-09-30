"use client";

import { useMemo } from "react";
import { List, type RowComponentProps } from "react-window";
import type { KeywordEntry } from "@/lib/algorithms/keywordList";
import { cn } from "@/lib/cn";

interface ChecklistRow {
  text: string;
  isWord: boolean;
}

interface RowData {
  rows: ChecklistRow[];
  selected: Set<string>;
  onToggle: (value: string) => void;
}

const ROW_HEIGHT = 32;
const LIST_HEIGHT = 384;

function ChecklistRowView({
  index,
  style,
  ariaAttributes,
  rows,
  selected,
  onToggle,
}: RowComponentProps<RowData>) {
  const row = rows[index];
  const id = `keyword-option-${index}`;
  return (
    <div style={style} {...ariaAttributes}>
      <label
        htmlFor={id}
        className={cn(
          "flex h-8 cursor-pointer items-center gap-2 rounded-sm pr-3 text-sm",
          "transition-colors duration-150 ease-out hover:bg-paper",
          row.isWord ? "pl-9 text-ink-muted" : "pl-3 text-ink",
        )}
      >
        <input
          id={id}
          type="checkbox"
          checked={selected.has(row.text)}
          onChange={() => onToggle(row.text)}
          className="h-4 w-4 shrink-0 accent-signal"
        />
        <span className="truncate">{row.text}</span>
      </label>
    </div>
  );
}

export interface KeywordChecklistProps {
  entries: KeywordEntry[];
  selected: Set<string>;
  onToggle: (value: string) => void;
}

/**
 * Every keyword with its words indented underneath, each a checkbox. A word
 * that appears under several keywords shares one selection - ticking "no"
 * under "no charge" also ticks it under "no cost", since it is the same
 * negative either way.
 */
export function KeywordChecklist({
  entries,
  selected,
  onToggle,
}: KeywordChecklistProps) {
  const rows = useMemo(() => {
    const flat: ChecklistRow[] = [];
    for (const entry of entries) {
      flat.push({ text: entry.phrase, isWord: false });
      for (const word of entry.words) flat.push({ text: word, isWord: true });
    }
    return flat;
  }, [entries]);

  return (
    <List
      rowComponent={ChecklistRowView}
      rowCount={rows.length}
      rowHeight={ROW_HEIGHT}
      rowProps={{ rows, selected, onToggle }}
      style={{ height: Math.min(rows.length * ROW_HEIGHT, LIST_HEIGHT) }}
    />
  );
}
