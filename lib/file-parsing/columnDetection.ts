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
  const matches = headers.filter((header) =>
    COLUMN_ALIASES.has(normalizeHeader(header)),
  );
  if (matches.length === 1) {
    return { status: "found", column: matches[0] };
  }
  return { status: "needs-selection" };
}
