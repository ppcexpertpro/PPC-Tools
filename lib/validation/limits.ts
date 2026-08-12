export type LimitStatus = "ok" | "warning" | "blocked";

// PRD §5.1: soft warning above 2,000 lines, hard stop above 5,000.
export const MATCH_TYPE_SOFT_WARNING_LINES = 2000;
export const MATCH_TYPE_HARD_CAP_LINES = 5000;

export function getLineCountStatus(count: number): LimitStatus {
  if (count > MATCH_TYPE_HARD_CAP_LINES) return "blocked";
  if (count > MATCH_TYPE_SOFT_WARNING_LINES) return "warning";
  return "ok";
}

// PRD §5.3: max 10MB file size, max 50,000 parsed rows.
export const NEG_FINDER_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const NEG_FINDER_MAX_ROWS = 50000;
