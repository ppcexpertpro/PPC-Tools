import {
  collapseSpaces,
  dedupeCaseInsensitive,
  removeDisallowedChars,
} from "@/lib/text/cleanup";

export interface MergeGroup {
  label: string;
  lines: string[];
}

export interface MergeOptions {
  lowercase?: boolean;
  removeExtraSymbols?: boolean;
  removeDuplicates?: boolean;
}

export type MergeResult =
  | { status: "needs-more-groups" }
  | { status: "too-many-combinations"; predictedCount: number }
  | { status: "ok"; combinations: string[]; count: number };

// PRD §5.2: predicted output capped at 20,000 merged keywords.
export const MAX_MERGE_COMBINATIONS = 20000;

export function mergeGroups(
  groups: MergeGroup[],
  options: MergeOptions = {},
): MergeResult {
  // Dedupe within each group first (unconditionally) to reduce
  // combinatorial blowup - PRD §5.2 edge case, TRD §5.2 pseudocode.
  const nonEmptyGroups = groups
    .map((group) => ({ ...group, lines: dedupeCaseInsensitive(group.lines) }))
    .filter((group) => group.lines.length > 0);

  if (nonEmptyGroups.length < 2) {
    return { status: "needs-more-groups" };
  }

  const predictedCount = nonEmptyGroups.reduce(
    (product, group) => product * group.lines.length,
    1,
  );
  if (predictedCount > MAX_MERGE_COMBINATIONS) {
    return { status: "too-many-combinations", predictedCount };
  }

  let combinations = [""];
  for (const group of nonEmptyGroups) {
    combinations = combinations.flatMap((prefix) =>
      group.lines.map((term) => `${prefix} ${term}`.trim()),
    );
  }

  if (options.lowercase) {
    combinations = combinations.map((combination) => combination.toLowerCase());
  }
  if (options.removeExtraSymbols) {
    combinations = combinations.map((combination) =>
      removeDisallowedChars(collapseSpaces(combination)),
    );
  }
  if (options.removeDuplicates) {
    combinations = dedupeCaseInsensitive(combinations);
  }

  return { status: "ok", combinations, count: combinations.length };
}
