// TRD §4: case-insensitive alias match against known search-term column names.
const COLUMN_ALIASES = new Set([
  "search term",
  "search terms",
  "query",
  "keyword",
  "keywords",
]);

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export type ColumnDetectionResult =
  { status: "found"; column: string } | { status: "needs-selection" };

/**
 * Auto-selects the search-term column when exactly one header matches a
 * known alias; otherwise (zero or multiple matches) the caller must surface
 * a manual picker over the full header list (PRD §5.3).
 */
export function detectSearchTermColumn(
  headers: string[],
): ColumnDetectionResult {
  const exact = headers.filter((header) =>
    COLUMN_ALIASES.has(normalizeHeader(header)),
  );
  if (exact.length === 1) {
    return { status: "found", column: exact[0] };
  }
  if (exact.length > 1) return { status: "needs-selection" };

  // Hand-made lists head the column "Negative Keywords" or "Negative
  // Keywords for Day spas PPC Account" - accept a header that mentions a
  // keyword/search-term column, but only when exactly one does.
  const mentions = headers.filter((header) =>
    MENTION_PATTERN.test(normalizeHeader(header)),
  );
  if (mentions.length === 1) {
    return { status: "found", column: mentions[0] };
  }
  return { status: "needs-selection" };
}

const MENTION_PATTERN = /\b(keywords?|search terms?|queries|query)\b/;
