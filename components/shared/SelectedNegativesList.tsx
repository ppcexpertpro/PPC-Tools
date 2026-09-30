"use client";

import { List, type RowComponentProps } from "react-window";
import { CloseIcon } from "@/components/shared/icons";

interface RowData {
  values: string[];
  onRemove: (value: string) => void;
}

const ROW_HEIGHT = 32;
const LIST_HEIGHT = 384;

function NegativeRow({
  index,
  style,
  ariaAttributes,
  values,
  onRemove,
}: RowComponentProps<RowData>) {
  const value = values[index];
  return (
    <div
      style={style}
      {...ariaAttributes}
      className="flex items-center justify-between gap-2 pl-3 pr-1 text-sm text-ink"
    >
      <span className="truncate">{value}</span>
      <button
        type="button"
        onClick={() => onRemove(value)}
        aria-label={`Remove ${value}`}
        className="grid h-7 w-7 shrink-0 place-items-center rounded-sm text-ink-muted transition-colors duration-150 ease-out hover:bg-paper hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal"
      >
        <CloseIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export interface SelectedNegativesListProps {
  values: string[];
  onRemove: (value: string) => void;
}

/** The chosen negatives, one per row, each removable on its own. */
export function SelectedNegativesList({
  values,
  onRemove,
}: SelectedNegativesListProps) {
  return (
    <List
      rowComponent={NegativeRow}
      rowCount={values.length}
      rowHeight={ROW_HEIGHT}
      rowProps={{ values, onRemove }}
      style={{ height: Math.min(values.length * ROW_HEIGHT, LIST_HEIGHT) }}
    />
  );
}
