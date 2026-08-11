"use client";

import { cn } from "@/lib/cn";

export type MatchType = "broad" | "phrase" | "exact" | "bmm";

interface MatchTypeDefinition {
  label: string;
  example: string;
  colorClass: string;
}

export const MATCH_TYPE_DEFINITIONS: Record<MatchType, MatchTypeDefinition> = {
  broad: {
    label: "Broad",
    example: "keyword",
    colorClass: "border-l-mt-broad",
  },
  phrase: {
    label: "Phrase",
    example: '"keyword"',
    colorClass: "border-l-mt-phrase",
  },
  exact: {
    label: "Exact",
    example: "[keyword]",
    colorClass: "border-l-mt-exact",
  },
  bmm: {
    label: "Broad Match Modifier (legacy)",
    example: "+word +word",
    colorClass: "border-l-mt-bmm",
  },
};

const DEFAULT_TYPES: MatchType[] = ["broad", "phrase", "exact", "bmm"];

type MatchTypeSelectorProps =
  | {
      mode?: "multi";
      types?: MatchType[];
      selected: MatchType[];
      onChange: (selected: MatchType[]) => void;
      legend?: string;
      id?: string;
    }
  | {
      mode: "single";
      types?: MatchType[];
      selected: MatchType;
      onChange: (selected: MatchType) => void;
      legend?: string;
      id?: string;
    };

/**
 * Reused as-is across all three tools (Implementation Plan §4 reuse risk):
 * checkbox multi-select for Tools 1–2, radio single-select for Tool 3's
 * negative-keyword export.
 */
export function MatchTypeSelector(props: MatchTypeSelectorProps) {
  const {
    types = DEFAULT_TYPES,
    legend = "Match types",
    id = "match-type",
  } = props;
  const isSingle = props.mode === "single";

  return (
    <div role="group" aria-label={legend} className="flex flex-col gap-2">
      <p className="text-sm font-medium text-ink">{legend}</p>
      <div className="flex flex-wrap gap-2">
        {types.map((type) => {
          const definition = MATCH_TYPE_DEFINITIONS[type];
          const inputId = `${id}-${type}`;
          const checked = isSingle
            ? props.selected === type
            : props.selected.includes(type);

          const handleChange = () => {
            if (isSingle) {
              (props.onChange as (value: MatchType) => void)(type);
              return;
            }
            const current = props.selected as MatchType[];
            const next = checked
              ? current.filter((selectedType) => selectedType !== type)
              : [...current, type];
            (props.onChange as (value: MatchType[]) => void)(next);
          };

          return (
            <label
              key={type}
              htmlFor={inputId}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border border-l-4 bg-surface px-3 py-2 text-sm",
                definition.colorClass,
                checked && "ring-1 ring-signal",
              )}
            >
              <input
                id={inputId}
                type={isSingle ? "radio" : "checkbox"}
                name={isSingle ? id : undefined}
                checked={checked}
                onChange={handleChange}
                className="h-4 w-4 accent-signal"
              />
              <span className="text-ink">{definition.label}</span>
              <span className="font-mono text-xs text-ink-faint">
                {definition.example}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
