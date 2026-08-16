"use client";

import type { DragEvent } from "react";
import { Textarea } from "@/components/shared/Textarea";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CloseIcon,
  GripIcon,
} from "@/components/shared/icons";
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
 * the drag handle (mouse drag, or arrow-up/down when focused); mobile swaps
 * to up/down buttons (UX-DESIGN §3.2 - touch drag is unreliable in a
 * scrolling column).
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
        // 24px outer, 16px padding, 8px inner textarea - concentric.
        "flex w-full flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-raised sm:w-64",
        "transition-[opacity,box-shadow,border-color] duration-200 ease-out",
        isDragging && "opacity-50 shadow-float",
      )}
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onKeyDown={(event) => {
            if (event.key === "ArrowUp") {
              event.preventDefault();
              onMoveUp();
            } else if (event.key === "ArrowDown") {
              event.preventDefault();
              onMoveDown();
            }
          }}
          aria-label={`Drag to reorder ${group.label}, or use arrow up and arrow down`}
          className="hit-area hidden h-8 w-8 shrink-0 cursor-grab select-none items-center justify-center rounded-md text-ink-faint transition-[background-color,color] duration-200 ease-out hover:bg-paper hover:text-ink-muted active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:flex"
        >
          <GripIcon className="h-4 w-4" />
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
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-ink-muted transition-[background-color,transform] duration-200 ease-out hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal active:scale-[0.96] disabled:opacity-30 disabled:active:scale-100"
          >
            <ArrowUpIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === totalGroups - 1}
            aria-label={`Move ${group.label} down`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-ink-muted transition-[background-color,transform] duration-200 ease-out hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal active:scale-[0.96] disabled:opacity-30 disabled:active:scale-100"
          >
            <ArrowDownIcon className="h-4 w-4" />
          </button>
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${group.label}`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-ink-faint transition-[background-color,color,transform] duration-200 ease-out hover:bg-danger-soft hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal active:scale-[0.96]"
          >
            <CloseIcon className="h-4 w-4" />
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
