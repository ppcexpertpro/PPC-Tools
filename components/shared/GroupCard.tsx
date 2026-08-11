"use client";

import type { DragEvent } from "react";
import { Textarea } from "@/components/shared/Textarea";
import { cn } from "@/lib/cn";

export interface MergeGroupData {
  id: string;
  label: string;
  value: string;
}

export interface GroupCardProps {
  group: MergeGroupData;
  index: number;
  totalGroups: number;
  onLabelChange: (label: string) => void;
  onValueChange: (value: string) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDragStart: (event: DragEvent<HTMLButtonElement>) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  canRemove: boolean;
}

/**
 * Draggable input group (Implementation Plan Phase 3). Desktop reorders via
 * the drag handle; mobile swaps to up/down buttons (UX-DESIGN §3.2 — touch
 * drag is unreliable in a scrolling column).
 */
export function GroupCard({
  group,
  index,
  totalGroups,
  onLabelChange,
  onValueChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  canRemove,
}: GroupCardProps) {
  const labelId = `group-${group.id}-label`;
  const textareaId = `group-${group.id}-input`;

  return (
    <div
      data-testid={`group-card-${group.id}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        "flex w-full flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:w-64",
        isDragging && "opacity-50",
      )}
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          aria-label={`Drag to reorder ${group.label}`}
          className="hidden h-8 w-8 shrink-0 cursor-grab select-none items-center justify-center text-ink-faint hover:text-ink-muted active:cursor-grabbing sm:flex"
        >
          ⠿
        </button>
        <label htmlFor={labelId} className="sr-only">
          Group name
        </label>
        <input
          id={labelId}
          type="text"
          value={group.label}
          onChange={(event) => onLabelChange(event.target.value)}
          className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 py-0.5 font-display text-sm font-semibold text-ink hover:border-border-strong focus-visible:border-border-strong focus-visible:outline-none"
        />
        <div className="flex sm:hidden">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            aria-label={`Move ${group.label} up`}
            className="flex h-11 w-11 shrink-0 items-center justify-center text-ink-muted disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === totalGroups - 1}
            aria-label={`Move ${group.label} down`}
            className="flex h-11 w-11 shrink-0 items-center justify-center text-ink-muted disabled:opacity-30"
          >
            ↓
          </button>
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${group.label}`}
            className="flex h-11 w-11 shrink-0 items-center justify-center text-ink-faint hover:text-danger"
          >
            ×
          </button>
        )}
      </div>
      <Textarea
        id={textareaId}
        label={`${group.label} terms`}
        hideLabel
        value={group.value}
        onChange={onValueChange}
        rows={6}
        placeholder="One term per line…"
        countLabel={(count) => `${count} ${count === 1 ? "line" : "lines"}`}
      />
    </div>
  );
}
