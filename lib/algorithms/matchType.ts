export type MatchType = "broad" | "phrase" | "exact" | "bmm";

export interface MatchTypeOptions {
  lowercase?: boolean;
  trimExtraWhitespace?: boolean;
  stripSpecialChars?: boolean;
  removeDuplicates?: boolean;
  sortAlphabetically?: boolean;
}

export interface MatchTypeResult {
  results: Partial<Record<MatchType, string[]>>;
  flagged: string[];
  validCount: number;
}

const MAX_KEYWORD_LENGTH = 80;
// Letters, numbers, spaces, and - ' & (PRD §5.1 "Strip special characters").
const DISALLOWED_CHARS = /[^a-zA-Z0-9\s\-'&]/g;

function collapseSpaces(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function removeDisallowedChars(text: string): string {
  return text.replace(DISALLOWED_CHARS, "");
}

/**
 * Undoes an existing match-type wrapper before reapplying one, so
 * re-processing an already-formatted list doesn't double-wrap
 * (PRD §5.1 edge case): "keyword" -> keyword, [keyword] -> keyword,
 * +word +word -> word word.
 */
function stripExistingWrapper(text: string): string {
  const trimmed = text.trim();

  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).trim();
  }

  if (trimmed.length >= 2 && trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed.slice(1, -1).trim();
  }

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  const isBmmWrapped =
    tokens.length > 0 &&
    tokens.every((token) => token.startsWith("+") && token.length > 1);
  if (isBmmWrapped) {
    return tokens.map((token) => token.slice(1)).join(" ");
  }

  return trimmed;
}

function formatMatchType(type: MatchType, keyword: string): string {
  switch (type) {
    case "broad":
      return keyword;
    case "phrase":
      return `"${keyword}"`;
    case "exact":
      return `[${keyword}]`;
    case "bmm":
      return keyword
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => `+${word}`)
        .join(" ");
  }
}

export function convertMatchTypes(
  lines: string[],
  selectedTypes: MatchType[],
  options: MatchTypeOptions = {},
): MatchTypeResult {
  const cleaned: string[] = [];
  const flagged: string[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    let text = line.trim();
    if (text.length === 0) continue;

    if (options.stripSpecialChars) {
      text = removeDisallowedChars(text);
    }
    if (options.trimExtraWhitespace) {
      text = collapseSpaces(text);
    }
    text = stripExistingWrapper(text);

    if (options.lowercase) {
      text = text.toLowerCase();
    }

    if (text.length === 0) continue;

    if (text.length > MAX_KEYWORD_LENGTH) {
      flagged.push(text);
      continue;
    }

    const dedupeKey = text.toLowerCase();
    if (options.removeDuplicates && seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);
    cleaned.push(text);
  }

  const finalList = options.sortAlphabetically
    ? [...cleaned].sort((a, b) => a.localeCompare(b))
    : cleaned;

  const results: Partial<Record<MatchType, string[]>> = {};
  for (const type of selectedTypes) {
    results[type] = finalList.map((keyword) => formatMatchType(type, keyword));
  }

  return { results, flagged, validCount: finalList.length };
}
